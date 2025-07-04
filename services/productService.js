const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const productModel = require('../models/Product');
const productVariationModel = require('../models/ProductVariation');
const productAttributeModel = require('../models/ProductAttribute');
const productAttributeVariationModel = require('../models/ProductAttributeVariation');
const supplierModel = require('../models/Supplier');
const categoryService = require('./categoryService');
const productFileModel = require('../models/ProductFile');
const { isArray } = require('util');

class Product {


    /** Get Attribute Data */
    async getAttributeById(id) {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw {
                message: 'Invalid attribute ID',
                statusCode: 400
            };
        }

        const attribute = await productAttributeModel.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: 'productattributevariations',
                    let: { attributeId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$productAttribute', '$$attributeId'] },
                                        { $eq: ['$isDeleted', false] }
                                    ]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: 'productmeasurementunits',
                                localField: 'productMeasurementUnit',
                                foreignField: '_id',
                                as: 'measurementUnit'
                            }
                        },
                        {
                            $unwind: {
                                path: '$measurementUnit',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                metaKey: 1,
                                metaValue: 1,
                                measurementUnit: {
                                    _id: '$measurementUnit._id',
                                    name: '$measurementUnit.name',
                                    symbol: '$measurementUnit.symbol'
                                }
                            }
                        }
                    ],
                    as: 'variations'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    slug: 1,
                    variations: 1
                }
            }
        ]);

        if (!attribute || attribute.length === 0) {
            throw {
                message: 'Product attribute not found',
                statusCode: 404
            };
        }

        return attribute[0];
    }
    /** Get Product Raw Data */
    async getProductRawData(req) {
        try {
            const suppliers = await supplierModel.find({ isDeleted: false }).select('_id companyName companyEmail companyPhone');
            const nestedCategories = await categoryService.getNestedCategories(req);

            const productAttributes = await productAttributeModel.aggregate([
                { $match: { isDeleted: false, status: 1 } },
                {
                    $lookup: {
                        from: 'productattributevariations',
                        let: { attributeId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$productAttribute', '$$attributeId'] },
                                            { $eq: ['$isDeleted', false] }
                                        ]
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: 'productmeasurementunits',
                                    localField: 'productMeasurementUnit',
                                    foreignField: '_id',
                                    as: 'measurementUnit'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$measurementUnit',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    metaKey: 1,
                                    metaValue: 1,
                                    measurementUnit: {
                                        _id: '$measurementUnit._id',
                                        name: '$measurementUnit.name',
                                        symbol: '$measurementUnit.symbol',
                                    }
                                }
                            }
                        ],
                        as: 'variations'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        slug: 1,
                        variations: 1
                    }
                }
            ]);

            return {
                nestedCategories,
                suppliers,
                productAttributes
            };
        } catch (error) {
            throw {
                message: error?.message || 'Failed to get product raw data.',
                statusCode: error?.statusCode || 500
            };
        }
    }

    /** Create Product Attribute */
    async createProductAttribute(req) {
        try {
            const payload = {
                externalId: req.body?.externalId ?? null,
                name: req.body?.name,
                slug: req.body?.slug,
                createdBy: req.user?.id || null,
                updatedBy: req.user?.id || null,
            };

            const createdAttribute = await productAttributeModel.create(payload);
            if (!createdAttribute) {
                throw { message: 'Product attribute not created', statusCode: 404 };
            }

            // Handle attribute variations if provided
            const variations = req.body?.variations ?? [];
            for (const variation of variations) {
                variation.productAttribute = createdAttribute._id;
                variation.createdBy = req.user?.id || null;
                variation.updatedBy = req.user?.id || null;
                await this.createProductAttributeVariation(variation);
            }

            return createdAttribute;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to create product attribute.',
                statusCode: error?.statusCode || 500
            };
        }
    }

    /** Create Product Attribute Variation */
    async createProductAttributeVariation(data) {
        try {
            const newVariation = new productAttributeVariationModel(data);
            return await newVariation.save();
        } catch (error) {
            throw new Error(`Error creating attribute variation: ${error.message}`);
        }
    }

    /** Create Query For Product Attribute */
    async buildProductAttributeListQuery(req) {
        const query = req.query;
        const conditionArr = [{ isDeleted: false }];

        if (query.search_string !== undefined && query.search_string !== "") {
            conditionArr.push({
                $or: [
                    { name: new RegExp(query.search_string, "i") },
                    { slug: new RegExp(query.search_string, "i") },
                ],
            });
        }

        if (query.status !== undefined) {
            if (query.status === "0" || query.status === 0) {
                conditionArr.push({ status: 0 });
            } else if (query.status === "1" || query.status === 1) {
                conditionArr.push({ status: 1 });
            } else if (query.status === "2" || query.status === 2) {
                conditionArr.push({ status: 2 });
            }
        }

        let builtQuery = {};
        if (conditionArr.length === 1) {
            builtQuery = conditionArr[0];
        } else if (conditionArr.length > 1) {
            builtQuery = { $and: conditionArr };
        }

        return builtQuery;
    }

    /** Get List Of Product Attributes */
    async productAttributeList(query, options) {
        try {
            const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
            const skip = (page - 1) * limit;

            const pipeline = [
                { $match: query },
                {
                    $lookup: {
                        from: 'productattributevariations',
                        let: { attributeId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$productAttribute', '$$attributeId'] },
                                            { $eq: ['$isDeleted', false] },
                                            { $eq: ['$status', 1] }
                                        ]
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: 'productmeasurementunits',
                                    localField: 'productMeasurementUnit',
                                    foreignField: '_id',
                                    as: 'measurementUnit'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$measurementUnit',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    metaKey: 1,
                                    metaValue: 1,
                                    measurementUnit: {
                                        _id: 1,
                                        name: 1,
                                        symbol: 1
                                    }
                                }
                            }
                        ],
                        as: 'variations'
                    }
                },
                {
                    $facet: {
                        metadata: [
                            { $count: "totalDocs" }
                        ],
                        data: [
                            { $sort: sort },
                            { $skip: skip },
                            { $limit: limit },
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    slug: 1,
                                    externalId: 1,
                                    status: 1,
                                    isDeleted: 1,
                                    variations: 1,
                                }
                            }
                        ]
                    }
                },
                {
                    $project: {
                        data: 1,
                        totalDocs: { $ifNull: [{ $arrayElemAt: ["$metadata.totalDocs", 0] }, 0] }
                    }
                }
            ];

            const [result] = await productAttributeModel.aggregate(pipeline);

            return {
                docs: result.data,
                totalDocs: result.totalDocs,
                limit,
                page,
                totalPages: Math.ceil(result.totalDocs / limit),
                hasNextPage: page * limit < result.totalDocs,
                hasPrevPage: page > 1,
                nextPage: page * limit < result.totalDocs ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null
            };
        } catch (error) {
            throw {
                message: error?.message || 'Something went wrong while fetching product attribute list.',
                statusCode: error?.statusCode || 500
            };
        }
    }

    /** Update Product Attribute */
    async updateProductAttribute(req) {
        try {
            const attributeId = req.params.id;

            const existingAttribute = await productAttributeModel.findById(attributeId);
            if (!existingAttribute) {
                throw { message: 'Product attribute not found', statusCode: 404 };
            }

            const updateData = {
                externalId: req.body?.externalId ?? existingAttribute.externalId,
                name: req.body?.name ?? existingAttribute.name,
                slug: req.body?.slug ?? existingAttribute.slug,
                updatedBy: req.user?.id || existingAttribute.updatedBy,
                updatedAt: new Date(),
            };

            // Get existing variations
            const existingVariations = await productAttributeVariationModel.find({
                productAttribute: attributeId,
                isDeleted: false
            });

            // Get variations to remove (if specified in request)
            const variationsToRemove = req.body?.variationsToRemove ?? [];
            if (variationsToRemove.length > 0) {
                await productAttributeVariationModel.updateMany(
                    {
                        _id: { $in: variationsToRemove },
                        productAttribute: attributeId // Ensure variations belong to this attribute
                    },
                    {
                        isDeleted: true,
                        updatedBy: req.user?.id || null,
                        updatedAt: new Date()
                    }
                );
            }

            // Update or add variations
            const variations = req.body?.variations ?? [];
            for (const variation of variations) {
                if (variation._id) {
                    // Verify the variation belongs to this attribute
                    const existingVariation = existingVariations.find(v => v._id.toString() === variation._id);
                    if (existingVariation) {
                        // Update existing variation
                        await productAttributeVariationModel.findByIdAndUpdate(
                            variation._id,
                            {
                                ...variation,
                                productAttribute: attributeId,
                                updatedBy: req.user?.id || null,
                                updatedAt: new Date()
                            },
                            { new: true }
                        );
                    }
                } else {
                    // Create new variation
                    variation.productAttribute = attributeId;
                    variation.createdBy = req.user?.id || null;
                    variation.updatedBy = req.user?.id || null;
                    await this.createProductAttributeVariation(variation);
                }
            }

            const updatedAttribute = await productAttributeModel.findByIdAndUpdate(attributeId, updateData, { new: true });
            return updatedAttribute;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to update product attribute.',
                statusCode: error?.statusCode || 500
            };
        }
    }

    /** Create Product */
    async createProduct(req) {



        // return false
        try {
            let {
                productVariations = [],
                categories = [],
                attributeVariations = [],
                attributes = [],
                supplier,
                ...productData
            } = req.body;

            // Parse stringified arrays if sent as strings
            productVariations = typeof productVariations === 'string' ? JSON.parse(productVariations) : productVariations;
            categories = typeof categories === 'string' ? JSON.parse(categories) : categories;
            attributeVariations = typeof attributeVariations === 'string' ? JSON.parse(attributeVariations) : attributeVariations;
            attributes = typeof attributes === 'string' ? JSON.parse(attributes) : attributes;

            // Clean and cast supplier to ObjectId
            if (typeof supplier === 'string') {
                supplier = supplier.replace(/^"+|"+$/g, '');
                productData.supplier = new mongoose.Types.ObjectId(supplier);
            }

            // Convert category and attributeVariation IDs to ObjectId
            productData.categories = categories.map(id => new mongoose.Types.ObjectId(String(id)));
            productData.attributeVariations = attributeVariations.map(id => new mongoose.Types.ObjectId(String(id)));
            productData.attributes = attributes.map(id => new mongoose.Types.ObjectId(String(id)));
            productData.createdBy = req?.user?.id;
            productData.updatedBy = req?.user?.id;

            // Step 1: Create the product
            const product = await productModel.create(productData);
            const productId = product._id.toString();

            // Step 2: Create upload folder
            const uploadDir = path.join(__dirname, '..', 'uploads/products', productId);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }


            // Step 3: Save featured image
            let featuredImageId = null;
            if (req.files.length > 0) {
                const productFeaturedImage = req.files.filter((file) => file?.fieldname === "productFeaturedImage");
                if (productFeaturedImage.length) {
                    const file = productFeaturedImage[0];
                    const filePath = path.join(uploadDir, file.originalname);
                    fs.writeFileSync(filePath, file.buffer);
                    const fileDoc = await productFileModel.create({
                        product: product._id,
                        fileName: file.originalname,
                        fileType: file.mimetype.split('/')[0] || 'other',
                        filePath: `/uploads/products/${productId}/${file.originalname}`,
                        fileSize: file.size,
                        isFeaturedImage: 1
                    });
                    featuredImageId = fileDoc._id;
                }

            }

            const variationIds = [];

            // Step 4: Save product variations

            for (let index = 0; index < productVariations.length; index++) {
                const variationData = productVariations[index];
                const variationImageIds = [];

                // Filter images that belong to this variation index
                const variationImageFiles = req.files.filter(file => {
                    const match = file.fieldname.match(/^productVariations\[(\d+)\]\.variationImages\[\d+\]$/);
                    return match && parseInt(match[1]) === index;
                });

                // Process and save each variation image
                for (const file of variationImageFiles) {
                    const filePath = path.join(uploadDir, file.originalname);
                    fs.writeFileSync(filePath, file.buffer);

                    const fileDoc = await productFileModel.create({
                        product: product._id,
                        fileName: file.originalname,
                        fileType: file.mimetype.split('/')[0] || 'other',
                        filePath: `/uploads/products/${productId}/${file.originalname}`,
                        fileSize: file.size,
                        isFeaturedImage: 0
                    });

                    variationImageIds.push(fileDoc._id);
                }

                // Save the variation with associated image IDs
                const variation = await productVariationModel.create({
                    ...variationData,
                    categories: categories.map(id => new mongoose.Types.ObjectId(String(id))),
                    supplier: new mongoose.Types.ObjectId(String(supplier)),
                    product: productId,
                    variationImages: variationImageIds
                });

                variationIds.push(variation._id);
            }


            // Step 5: Update product with relationships
            product.productVariations = variationIds.map(id => new mongoose.Types.ObjectId(id));
            product.productFeaturedImage = featuredImageId ? new mongoose.Types.ObjectId(featuredImageId) : null;

            // Sample usage:

            // Check if allowSample is true before updating samples
            if (req?.body?.allowSample === "true") {
                let newSample;
                let inputSamples = req.body.samples;

                // Parse if input is a JSON string
                if (typeof inputSamples === 'string') {
                    try {
                        inputSamples = JSON.parse(inputSamples);
                    } catch (err) {
                        return res.status(400).json({ message: 'Invalid samples JSON' });
                    }
                }

                // Merge provided values with default structure
                newSample = {
                    small: {
                        enabled: true,
                        freePerMonth: inputSamples?.small?.freePerMonth ?? true,
                        price: Number(inputSamples?.small?.price) || 0 // always 0 for small sample
                    },
                    large: {
                        enabled: true,
                        priceType: inputSamples?.large?.priceType ?? 'fixed',
                        price: Number(inputSamples?.large?.price) || 0
                    },
                    full: {
                        enabled: true,
                        priceType: inputSamples?.full?.priceType ?? 'fixed',
                        price: Number(inputSamples?.full?.price) || 0
                    }
                };
                product.samples = newSample;
            }

            await product.save();

            return product;

        } catch (error) {
            console.error(error);
            throw {
                message: error?.message || 'Failed to create product.',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async checkProductIsOutOfStock(productVariations) {
        const isAllOutOfStock = productVariations.every(variation =>
            variation.stockStatus === 'out_of_stock' || Number(variation.stockQuantity) === 0
        );

        return isAllOutOfStock ? 'out_of_stock' : 'in_stock';
    }


    /** Update Product */
    async updateProduct(req) {
        try {
            const productId = req.params.id;
            let {
                productVariations = [],
                categories = [],
                attributeVariations = [],
                attributes = [],
                supplier,
                variationsToRemove = [], // Add this to handle variation deletion
                variationsImagesToRemove = [], // Add this to handle any particular variation image deletion
                ...productData
            } = req.body;

            // Parse stringified arrays if sent as strings
            productVariations = typeof productVariations === 'string' ? JSON.parse(productVariations) : productVariations;
            categories = typeof categories === 'string' ? JSON.parse(categories) : categories;
            attributeVariations = typeof attributeVariations === 'string' ? JSON.parse(attributeVariations) : attributeVariations;
            attributes = typeof attributes === 'string' ? JSON.parse(attributes) : attributes;
            variationsToRemove = typeof variationsToRemove === 'string' ? JSON.parse(variationsToRemove) : variationsToRemove;
            variationsImagesToRemove = typeof variationsImagesToRemove === 'string' ? JSON.parse(variationsImagesToRemove) : variationsImagesToRemove;

            // Clean and cast supplier to ObjectId
            if (typeof supplier === 'string') {
                supplier = supplier.replace(/^"+|"+$/g, '');
                productData.supplier = new mongoose.Types.ObjectId(supplier);
            }

            // Convert category and attributeVariation IDs to ObjectId
            productData.categories = categories.map(id => new mongoose.Types.ObjectId(id));
            productData.attributeVariations = attributeVariations.map(id => new mongoose.Types.ObjectId(id));
            productData.attributes = attributes.map(id => new mongoose.Types.ObjectId(id));
            delete productData?.createdBy;
            productData.updatedBy = req?.user?.id;

            const stockStatus = await this.checkProductIsOutOfStock(productVariations);
            productData.stockStatus = stockStatus;

            // Step 1: Update the product
            const product = await productModel.findByIdAndUpdate(productId, productData, { new: true });
            if (!product) {
                throw { message: 'Product not found', statusCode: 404 };
            }

            // Step 2: Ensure upload folder exists
            const uploadDir = path.join(__dirname, '..', 'uploads/products', productId);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Step 3: Handle featured image if provided
            if (req.files.length > 0) {
                const productFeaturedImage = req.files.filter((file) => file?.fieldname === "productFeaturedImage");
                if (productFeaturedImage.length) {
                    const file = productFeaturedImage[0];
                    const filePath = path.join(uploadDir, file.originalname);
                    fs.writeFileSync(filePath, file.buffer);
                    const fileDoc = await productFileModel.create({
                        product: product._id,
                        fileName: file.originalname,
                        fileType: file.mimetype.split('/')[0] || 'other',
                        filePath: `/uploads/products/${productId}/${file.originalname}`,
                        fileSize: file.size,
                        isFeaturedImage: 1
                    });
                    // Update product with new featured image
                    await productModel.findByIdAndUpdate(productId, { productFeaturedImage: fileDoc._id });
                }

            }


            // Step 4: Handle variations to remove
            if (variationsToRemove.length) {
                await productVariationModel.updateMany({ _id: { $in: variationsToRemove } }, { $set: { isDeleted: true } });

                // Also remove associated variation images
                await productFileModel.updateMany(
                    {
                        isFeaturedImage: 0,
                        _id: { $in: variationsToRemove.map(v => v.productVariationImages).flat() }
                    },
                    {
                        $set: { isDeleted: true }
                    }
                );
            }







            const variationIdList = []; // To collect all variation IDs (new or existing)
            for (let index = 0; index < productVariations.length; index++) {
                const variationData = productVariations[index];
                let variationImageIds = [];

                // ✅ First, check if req.files has any valid "productVariations" fields
                let variationImageFiles = [];
                if (
                    Array.isArray(req.files) &&
                    req.files.some(file => file.fieldname.startsWith(`productVariations[${index}]`))
                ) {
                    variationImageFiles = req.files.filter(file => {
                        const match = file.fieldname.match(/^productVariations\[(\d+)\]\.variationImages\[\d+\]$/);
                        return match && parseInt(match[1]) === index;


                    });
                } else {
                    delete variationData?.variationImages;
                }

                // ✅ Process and upload files if they exist
                if (variationImageFiles.length > 0) {
                    for (const file of variationImageFiles) {
                        const filePath = path.join(uploadDir, file.originalname);
                        fs.writeFileSync(filePath, file.buffer);

                        const fileDoc = await productFileModel.create({
                            product: product._id,
                            fileName: file.originalname,
                            fileType: file.mimetype.split('/')[0] || 'other',
                            filePath: `/uploads/products/${productId}/${file.originalname}`,
                            fileSize: file.size,
                            isFeaturedImage: 0
                        });

                        variationImageIds.push(new mongoose.Types.ObjectId(String(fileDoc.id)));
                    }
                }

                // ✅ Construct variation data object
                const baseVariationData = {
                    ...variationData,
                    supplier: new mongoose.Types.ObjectId(String(supplier)),
                    categories: categories.map(id => new mongoose.Types.ObjectId(String(id))),
                    product: product._id
                };

                if (variationsImagesToRemove.length) {

                    // ✅ Step 1: Mark the images as deleted in productFileModel
                    await productFileModel.updateMany(
                        {
                            _id: { $in: variationsImagesToRemove }
                        },
                        {
                            $set: { isDeleted: true }
                        }
                    );

                    // ✅ Step 2: Remove the image IDs from the variationsImages array in productVariationModel
                    await productVariationModel.findByIdAndUpdate(
                        variationData._id,
                        {
                            $pull: { variationsImages: { $in: variationsImagesToRemove } }
                        },
                        { new: true }
                    );
                }

                if (variationData._id) {
                    if (variationImageIds?.length > 0) {

                        const checkExistingVariationData = await productVariationModel.findOne({ _id: variationData._id });
                        baseVariationData.variationImages = [
                            ...(checkExistingVariationData?.variationImages || []),
                            ...variationImageIds
                        ];

                    }

                    await productVariationModel.findByIdAndUpdate(
                        variationData._id,
                        baseVariationData,
                        { new: true }
                    );
                    variationIdList.push(new mongoose.Types.ObjectId(String(variationData._id)));

                } else {
                    // ✅ Always set image array on create (empty or not)
                    baseVariationData.variationImages = variationImageIds;

                    const newVariation = await productVariationModel.create(baseVariationData);
                    variationIdList.push(new mongoose.Types.ObjectId(String(newVariation._id)));
                }
                // ✅ Finally update the product's productVariations array with all collected variation IDs
                if (variationIdList.length > 0) {
                    await productModel.findByIdAndUpdate(
                        productId,
                        {
                            $addToSet: {
                                productVariations: { $each: variationIdList }
                            }
                        }
                    );
                }
            }


            // Return updated product with populated fields
            const updatedProduct = await productModel.findById(productId);

            return updatedProduct;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to update product.',
                statusCode: error?.statusCode || 500
            };
        }
    }

    /** Build Query For Product List */
    async buildProductListQuery(req) {
        const {
            status,
            stockStatus,
            search_string,
            supplier,
            categories,
            attributes,
            attributeVariations,
            minPriceB2B,
            maxPriceB2B,
            minPriceB2C,
            maxPriceB2C
        } = req.query;

        const conditions = [{ isDeleted: false }];

        // Status filter
        const normalizedStatus = status?.toString();
        if (["0", "1"].includes(normalizedStatus)) {
            conditions.push({ status: Number(normalizedStatus) });
        }

        // Stock status
        if (["in_stock", "out_of_stock"].includes(stockStatus)) {
            conditions.push({ stockStatus });
        }

        // Search string
        if (search_string) {
            const regex = new RegExp(search_string, "i");
            conditions.push({
                $or: [
                    { name: regex },
                    { sku: regex },
                    { slug: regex },
                    { description: regex },
                    { shortDescription: regex },
                ],
            });
        }

        // Supplier
        if (supplier) {
            try {
                conditions.push({ supplier: new mongoose.Types.ObjectId(supplier) });
            } catch (err) {
                console.error("Invalid supplier ID", err);
            }
        }

        // Helper for array filters
        const pushArrayFilter = (field, raw) => {
            if (!raw) return;
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const ids = parsed.map(id => new mongoose.Types.ObjectId(id));
                    conditions.push({ [field]: { $all: ids } });
                    // if(field === "attributeVariations"){
                    //     conditions.push({ [field]: { $all: ids } });
                    // }else{
                    //     conditions.push({ [field]: { $in: ids } });
                    // }
                }
            } catch (err) {
                console.error(`Invalid ${field} JSON`, err);
            }
        };

        pushArrayFilter("attributes", attributes);
        pushArrayFilter("attributeVariations", attributeVariations);
        pushArrayFilter("categories", categories);

        // Price range filters
        const pushPriceFilter = (field, min, max) => {
            const priceCond = {};
            if (min !== undefined) priceCond.$gte = parseFloat(min);
            if (max !== undefined) priceCond.$lte = parseFloat(max);
            if (Object.keys(priceCond).length > 0) {
                conditions.push({ [field]: priceCond });
            }
        };

        if (!attributeVariations) {
            pushPriceFilter("priceB2B", minPriceB2B, maxPriceB2B);
            //pushPriceFilter("priceB2C", minPriceB2C, maxPriceB2C);
        }

        return conditions.length > 1 ? { $and: conditions } : conditions[0];
    }

    /** Get Product List */
    async exportCsv() {
        try {
            const products = await productModel.find({ isDeleted: false })
                .populate("supplier")
                .populate("categories")
                .populate("attributes")
                .populate({
                    path: "attributeVariations",
                    populate: [{ path: "productAttribute" }, { path: "productMeasurementUnit" }],
                })
                .populate({
                    path: "productVariations",
                    populate: [
                        /*  { path: "supplier" }, */
                        { path: "categories" },
                        { path: "attributes" },
                        {
                            path: "attributeVariations",
                            populate: [{ path: "productAttribute" }, { path: "productMeasurementUnit" }],
                        },
                        { path: "variationImages" },
                        { path: "productFeaturedImage" },
                    ],
                })
                .populate("productFeaturedImage")
                .lean();
            return products;
        } catch (error) {
            throw {
                message: error?.message || 'Something went wrong while fetching products',
                statusCode: error?.statusCode || 500
            };
        }
    }

    /** Get Product List */
    async productList(req, query, options) {
        try {
            const {
                page = 1,
                limit = 10,
                sort
            } = options;

            const skip = (page - 1) * limit;

            const rawAttributeVariations = req?.query?.attributeVariations ?? '[]';

            let attributeVariationIds = [];


            try {
                const parsed = JSON.parse(rawAttributeVariations);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    attributeVariationIds = parsed
                        .filter(id => mongoose.Types.ObjectId.isValid(id))
                        .map(id => new mongoose.Types.ObjectId(id));
                }
            } catch (err) {
                console.warn("Invalid attributeVariations query param. Skipping filtering.", err);
            }

            const pipeline = [
                { $match: query },

                // Lookup supplier
                {
                    $lookup: {
                        from: 'suppliers',
                        localField: 'supplier',
                        foreignField: '_id',
                        as: 'supplier'
                    }
                },
                { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },

                // Lookup categories
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'categories',
                        foreignField: '_id',
                        as: 'categories'
                    }
                },

                // Lookup product variations
                {
                    $lookup: {
                        from: 'productvariations',
                        localField: '_id',
                        foreignField: 'product',
                        as: 'productVariations'
                    }
                },



                // // Filter and find matched variations by attributeVariationIds
                ...(attributeVariationIds.length > 0 ? [
                    {
                        $addFields: {
                            matchedVariation: {
                                $first: {
                                    $filter: {
                                        input: '$productVariations',
                                        as: 'variation',
                                        cond: {
                                            $gt: [
                                                {
                                                    $cond: [
                                                        { $isArray: '$$variation.attributeVariations' },
                                                        {
                                                            $size: {
                                                                $filter: {
                                                                    input: '$$variation.attributeVariations',
                                                                    as: 'av',
                                                                    cond: { $in: ['$$av', attributeVariationIds] }
                                                                }
                                                            }
                                                        },
                                                        0
                                                    ]
                                                },
                                                0
                                            ]

                                        }
                                    }
                                }
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'productfiles',
                            localField: 'matchedVariation.variationImages',
                            foreignField: '_id',
                            as: 'matchedVariationImages'
                        }
                    },
                    {
                        $addFields: {
                            matchedDisplayImage: { $arrayElemAt: ['$matchedVariationImages', 0] },
                            matchedVariationPrice: '$matchedVariation.regularPriceB2B'

                        }
                    },
                    ...(req.query.minPriceB2B && req.query.maxPriceB2B ? [
                        {
                            $match: {
                                ...(req.query.minPriceB2B ? { matchedVariationPrice: { $gte: Number(req.query.minPriceB2B) } } : {}),
                                ...(req.query.maxPriceB2B ? { matchedVariationPrice: { $lte: Number(req.query.maxPriceB2B) } } : {})
                            }
                        }
                    ] : [])
                ] : []),

                // Lookup featured image
                {
                    $lookup: {
                        from: 'productfiles',
                        localField: 'productFeaturedImage',
                        foreignField: '_id',
                        as: 'featuredImage'
                    }
                },
                { $unwind: { path: '$featuredImage', preserveNullAndEmptyArrays: true } },

                // Total quantity calculation & image selection
                {
                    $addFields: {
                        totalQuantity: {
                            $sum: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$productVariations',
                                            as: 'variation',
                                            cond: { $eq: ['$$variation.isDeleted', false] }
                                        }
                                    },
                                    as: 'variation',
                                    in: { $ifNull: ['$$variation.stockQuantity', 0] }
                                }
                            }
                        },
                        displayImage: {
                            $cond: [
                                { $gt: [{ $size: { $ifNull: ['$matchedVariationImages', []] } }, 0] },
                                '$matchedDisplayImage',
                                '$featuredImage'

                            ]
                        }
                    }
                },

                { $sort: sort },

                {
                    $project: {
                        _id: 1,
                        name: 1,
                        sku: 1,
                        defaultPrice: 1,
                        minPriceB2B: 1,
                        maxPriceB2B: 1,
                        minPriceB2C: 1,
                        maxPriceB2C: 1,
                        totalQuantity: 1,
                        stockStatus: 1,
                        status: 1,
                        shortDescription: 1,
                        supplier: {
                            _id: '$supplier._id',
                            companyName: '$supplier.companyName'
                        },
                        categories: {
                            _id: 1,
                            name: 1
                        },
                        attributes: 1,
                        attributeVariations: 1,
                        displayImage: {
                            _id: 1,
                            filePath: 1
                        },
                        productVariations: 1,
                        featuredImage: {
                            _id: 1,
                            filePath: 1,

                        },
                        productImages: {
                            _id: 1,
                            filePath: 1
                        },
                        matchedVariationPrice: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }
                },

                { $skip: skip },
                { $limit: limit }
            ];

            const data = await productModel.aggregate(pipeline);

            // Get total count
            const totalCountAgg = await productModel.aggregate([
                { $match: query },
                { $count: 'total' }
            ]);
            const totalDocs = totalCountAgg[0]?.total || 0;

            return {
                docs: data,
                totalDocs,
                limit,
                page,
                totalPages: Math.ceil(totalDocs / limit),
                hasNextPage: page * limit < totalDocs,
                hasPrevPage: page > 1
            };

        } catch (error) {
            throw {
                message: error?.message || 'Something went wrong while fetching products',
                statusCode: error?.statusCode || 500
            };
        }
    }

    /** Build Front Product List */
    async buildFrontProductListQuery(req) {
        const {
            status,
            stockStatus,
            search_string,
            supplier,
            categories,
            attributes,
            attributeVariations,
            minPriceB2B,
            maxPriceB2B,
            minPriceB2C,
            maxPriceB2C
        } = req.query;

        const conditions = [{ isDeleted: false }];

        // Status filter
        const normalizedStatus = status?.toString();
        if (["0", "1"].includes(normalizedStatus)) {
            conditions.push({ status: Number(normalizedStatus) });
        }

        // Stock status
        if (["in_stock", "out_of_stock"].includes(stockStatus)) {
            conditions.push({ stockStatus });
        }

        // Supplier
        if (supplier) {
            try {
                conditions.push({ supplier: new mongoose.Types.ObjectId(supplier) });
            } catch (err) {
                console.error("Invalid supplier ID", err);
            }
        }

        // Helper for array filters
        const pushArrayFilter = (field, raw) => {
            if (!raw) return;
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const ids = parsed.map(id => new mongoose.Types.ObjectId(id));
                    // conditions.push({ [field]: { $in: ids } });
                    if (field === "attributeVariations") {
                        conditions.push({ [field]: { $all: ids } });
                    } else {
                        conditions.push({ [field]: { $in: ids } });
                    }
                }
            } catch (err) {
                console.error(`Invalid ${field} JSON`, err);
            }
        };

        pushArrayFilter("attributes", attributes);
        pushArrayFilter("attributeVariations", attributeVariations);
        pushArrayFilter("categories", categories);

        // Price range filters
        const pushPriceFilter = (field, min, max) => {
            const priceCond = {};
            if (min !== undefined) priceCond.$gte = parseFloat(min);
            if (max !== undefined) priceCond.$lte = parseFloat(max);
            if (Object.keys(priceCond).length > 0) {
                conditions.push({ [field]: priceCond });
            }
        };

        if (minPriceB2B && maxPriceB2B) {
            pushPriceFilter("regularPriceB2B", minPriceB2B, maxPriceB2B);
            //pushPriceFilter("priceB2C", minPriceB2C, maxPriceB2C);
        }

        return conditions.length > 1 ? { $and: conditions } : conditions[0];
    }

    /***  Front Product List **/
    async productFrontList(req, query, options) {
        try {
            const {
                page = 1,
                limit = 10,
                sort
            } = options;

            const skip = (page - 1) * limit;

            const searchString = req?.query?.search_string;
            const pipeline = [
                { $match: query },

                {
                    $lookup: {
                        from: 'products',
                        localField: 'product',
                        foreignField: '_id',
                        as: 'productDetail'
                    }
                },
                { $unwind: { path: '$productDetail', preserveNullAndEmptyArrays: true } },
                // 🔍 Search inside product fields (after product lookup/unwind)
                ...(searchString ? [{
                    $match: {
                        $or: [
                            { "productDetail.name": new RegExp(searchString, "i") },
                            { "productDetail.sku": new RegExp(searchString, "i") },
                            { "productDetail.slug": new RegExp(searchString, "i") },
                            { "productDetail.description": new RegExp(searchString, "i") },
                            { "productDetail.shortDescription": new RegExp(searchString, "i") },
                        ],
                    }
                }] : []),


                // Lookup supplier
                {
                    $lookup: {
                        from: 'suppliers',
                        localField: 'supplier',
                        foreignField: '_id',
                        as: 'supplier'
                    }
                },
                { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
                {
                    $match: {
                        'productDetail.isDeleted': false // ✅ Ensure the parent product is not deleted
                    }
                },

                // Lookup categories
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'categories',
                        foreignField: '_id',
                        as: 'categories'
                    }
                },

                {
                    $lookup: {
                        from: 'productfiles',
                        localField: 'variationImages',
                        foreignField: '_id',
                        as: 'variationImagesDetail'
                    }
                },


                // Lookup featured image
                {
                    $lookup: {
                        from: 'productfiles',
                        localField: 'productFeaturedImage',
                        foreignField: '_id',
                        as: 'featuredImage'
                    }
                },
                { $unwind: { path: '$featuredImage', preserveNullAndEmptyArrays: true } },

                // Total quantity calculation & image selectio

                { $sort: sort },

                {
                    $project: {
                        _id: 1,
                        productDetail: {
                            name: 1,
                            featuredImage: 1,
                            _id: 1,
                        },
                        variationImages: 1,
                        variationImagesDetail: 1,
                        stockQuantity: 1,
                        status: 1,
                        weight: 1,
                        dimensions: 1,
                        variationImages: 1,
                        status: 1,
                        regularPriceB2B: 1,
                        regularPriceB2C: 1,
                        salePrice: 1,
                        purchasedPrice: 1,
                        numberOfTiles: 1,
                        boxSize: 1,
                        palletSize: 1,
                        palletWeight: 1,
                        sqmPerTile: 1,
                        boxesPerPallet: 1,
                        tierDiscount: 1,
                        shippingClass: 1,
                        taxClass: 1,
                        minPriceB2B: 1,
                        maxPriceB2B: 1,
                        minPriceB2C: 1,
                        maxPriceB2C: 1,
                        stockStatus: 1,
                        shortDescription: 1,
                        supplier: {
                            _id: '$supplier._id',
                            companyName: '$supplier.companyName'
                        },
                        categories: {
                            _id: 1,
                            name: 1
                        },
                        attributes: 1,
                        attributeVariations: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }
                },

                { $skip: skip },
                { $limit: limit }
            ];



            const data = await productVariationModel.aggregate(pipeline);

            // Get total count
            const totalCountAgg = await productVariationModel.aggregate([
                { $match: query },
                { $count: 'total' }
            ]);
            const totalDocs = totalCountAgg[0]?.total || 0;

            return {
                docs: data,
                totalDocs,
                limit,
                page,
                totalPages: Math.ceil(totalDocs / limit),
                hasNextPage: page * limit < totalDocs,
                hasPrevPage: page > 1
            };

        } catch (error) {
            throw {
                message: error?.message || 'Something went wrong while fetching products',
                statusCode: error?.statusCode || 500
            };
        }
    }


    async getProductNamesWithVariations(query, options) {
        try {
            const {
                page = 1,
                limit = 10,
                sort = { createdAt: -1 }
            } = options;
    
            const skip = (page - 1) * limit;
    
            const pipeline = [
                {
                    $lookup: {
                        from: 'products',
                        localField: 'product',
                        foreignField: '_id',
                        as: 'productDetail'
                    }
                },
                { $unwind: '$productDetail' },
                {
                    $lookup: {
                        from: 'productfiles',
                        localField: 'variationImages',
                        foreignField: '_id',
                        as: 'variationImagesDetail'
                    }
                },
                { $unwind: { path: '$variationImagesDetail', preserveNullAndEmptyArrays: true } },
                {
                    $match: {
                        ...query,
                        'productDetail.isDeleted': false
                    }
                },
                { $sort: sort },
                {
                    $project: {
                        _id: 1,
                        productName: '$productDetail.name',
                        regularPriceB2C: 1,
                        variationImagesDetail: 1
                    }
                },
                { $skip: skip },
                { $limit: limit },
            ];
    
            return await productVariationModel.aggregate(pipeline);
        } catch (error) {
            throw {
                message: error?.message || 'Something went wrong while fetching product variations',
                statusCode: error?.statusCode || 500
            };
        }
    }
    
    
    




    async getProductById(id) {
        try {
            const product = await productModel.findById(id).populate([
                {
                    path: 'supplier',
                    match: { isDeleted: false },
                    select: '_id companyName companyEmail',
                    populate: [
                        {
                            path: 'discounts',
                        },
                    ]
                },
                {
                    path: 'categories',
                    match: { isDeleted: false },
                    select: '_id name'
                },
                {
                    path: 'attributeVariations',
                    match: { isDeleted: false },
                    populate: {
                        path: 'productMeasurementUnit',
                        match: { isDeleted: false },
                        select: '_id name symbol'
                    }
                },
                {
                    path: 'createdBy',
                    match: { isDeleted: false },
                    select: '_id name email phone'
                },
                {
                    path: 'updatedBy',
                    match: { isDeleted: false },
                    select: '_id name email phone'
                },
                {
                    path: 'productVariations',
                    match: { isDeleted: false },
                    populate: [
                        {
                            path: 'variationImages',
                            match: { isDeleted: false },
                            select: '_id filePath fileName'
                        },
                        {
                            path: 'attributeVariations',
                            match: { isDeleted: false },
                            populate: {
                                path: 'productMeasurementUnit',
                                match: { isDeleted: false },
                                select: '_id name symbol'
                            }
                        },
                        {
                            path: 'product',
                            match: { isDeleted: false },
                            select: '_id name shortDescription'
                        }
                    ]
                },
                {
                    path: 'productFeaturedImage',
                    match: { isDeleted: false },
                    select: '_id filePath fileName isFeaturedImage'
                }
            ]);

            if (!product) {
                throw { message: 'Product not found', statusCode: 404 };
            }

            const productObject = product.toObject();
            productObject.totalQuantity = product.productVariations?.reduce(
                (sum, v) => sum + (v.stockQuantity || 0),
                0
            ) || 0;
            if (productObject.productVariations) {
                productObject.productVariations = productObject.productVariations.map(variation => {
                  const attributeVariationsDetail = variation.attributeVariations || [];
                  const attributeVariationsIds = attributeVariationsDetail.map(av => av._id);
                  return {
                    ...variation,
                    attributeVariations: attributeVariationsIds,
                    attributeVariationsDetail
                  };
                });
              }

            // Fetch associated products based on shared categories
            const categoryIds = product.categories?.map(cat => cat._id) || [];

            const associatedProducts = await productModel.find({
                _id: { $ne: product._id }, // Exclude the main product
                categories: { $in: categoryIds },
                isDeleted: false,
                status: true
            })
                .limit(10)
                .select('_id name shortDescription productFeaturedImage minPriceB2B maxPriceB2B slug sku')
                .populate([{
                    path: 'productFeaturedImage',
                    match: { isDeleted: false },
                    select: '_id filePath fileName isFeaturedImage'
                }, 
                {
                    path: 'productVariations',
                    match: { isDeleted: false }
                }]);

            // Attach to response
            productObject.associatedProducts = associatedProducts;

            return productObject;
        } catch (error) {
            throw {
                message: error.message || 'Failed to fetch product details',
                statusCode: error.statusCode || 500
            };
        }
    }



}

module.exports = new Product();
