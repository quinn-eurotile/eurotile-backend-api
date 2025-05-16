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
                { $match: { isDeleted: false } },
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
        try {
            let {
                productVariations = [],
                categories = [],
                attributeVariations = [],
                supplier,
                ...productData
            } = req.body;

            // Parse stringified arrays if sent as strings
            productVariations = typeof productVariations === 'string' ? JSON.parse(productVariations) : productVariations;
            categories = typeof categories === 'string' ? JSON.parse(categories) : categories;
            attributeVariations = typeof attributeVariations === 'string' ? JSON.parse(attributeVariations) : attributeVariations;

            console.log('productVariations create',productVariations)
            // Clean and cast supplier to ObjectId
            if (typeof supplier === 'string') {
                supplier = supplier.replace(/^"+|"+$/g, '');
                productData.supplier = new mongoose.Types.ObjectId(supplier);
            }

            // Convert category and attributeVariation IDs to ObjectId
            productData.categories = categories.map(id => new mongoose.Types.ObjectId(id));
            productData.attributeVariations = attributeVariations.map(id => new mongoose.Types.ObjectId(id));

            // Step 1: Create the product
            const product = await productModel.create(productData);
            const productId = product._id.toString();

            // Step 2: Create upload folder
            const uploadDir = path.join(__dirname, '..', 'uploads', productId);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Step 3: Handle file uploads
            const savedImageIds = [];

            if (req.files?.productImages) {

                for (const file of req.files.productImages) {
                    const filePath = path.join(uploadDir, file.originalname);
                    fs.writeFileSync(filePath, file.buffer);

                    const fileDoc = await productFileModel.create({
                        product: product._id,
                        fileName: file.originalname,
                        fileType: file.mimetype.split('/')[0] || 'other',
                        filePath: `/uploads/${productId}/${file.originalname}`,
                        fileSize: file.size,
                        isFeaturedImage: 0
                    });

                    savedImageIds.push(fileDoc._id);
                }
            }

            // Step 4: Save featured image
            let featuredImageId = null;
            if (req.files?.productFeaturedImage?.length > 0) {
                const file = req.files.productFeaturedImage[0];
                const filePath = path.join(uploadDir, file.originalname);
                fs.writeFileSync(filePath, file.buffer);

                const fileDoc = await productFileModel.create({
                    product: product._id,
                    fileName: file.originalname,
                    fileType: file.mimetype.split('/')[0] || 'other',
                    filePath: `/uploads/${productId}/${file.originalname}`,
                    fileSize: file.size,
                    isFeaturedImage: 1
                });

                featuredImageId = fileDoc._id;
            }

            // Step 5: Save product variations
            const variationIds = [];
            for (const variationData of productVariations) {
                const variation = await productVariationModel.create({
                    ...variationData,
                    product: productId
                });
                variationIds.push(variation._id);
            }

            // Step 6: Update product with relationships
            product.productVariations = variationIds.map(id => new mongoose.Types.ObjectId(id));
            product.productImages = savedImageIds.map(id => new mongoose.Types.ObjectId(id));
            product.productFeaturedImage = featuredImageId ? new mongoose.Types.ObjectId(featuredImageId) : null;

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


    /** Update Product */
    async updateProduct(req) {
        try {
            
            let {
                productVariations = [],
                categories = [],
                attributeVariations = [],
                supplier,
                ...productData
            } = req.body;
console.log(typeof productVariations === 'string')
            // Parse stringified arrays if sent as strings
            productVariations = typeof productVariations === 'string' ? JSON.parse(productVariations) : productVariations;
            categories = typeof categories === 'string' ? JSON.parse(categories) : categories;
            attributeVariations = typeof attributeVariations === 'string' ? JSON.parse(attributeVariations) : attributeVariations;

            console.log('productVariations update',productVariations)
    
            // Convert string IDs to ObjectIds
            if (supplier) {
                supplier = supplier.replace(/^"+|"+$/g, '');
                productData.supplier = new mongoose.Types.ObjectId(supplier);
            }
    
            productData.categories = categories.map(id => new mongoose.Types.ObjectId(id));
            productData.attributeVariations = attributeVariations.map(id => new mongoose.Types.ObjectId(id));
    
            const productId = req.params.id;
            const existingProduct = await productModel.findById(productId);
    
            if (!existingProduct) {
                throw { message: 'Product not found', statusCode: 404 };
            }
    
            // Create upload directory
            const uploadDir = path.join(__dirname, '..', 'uploads', productId);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
    
            // Handle new product images
            if (req.files?.productImages?.length > 0) {
                const savedImageIds = [];
    
                for (const file of req.files.productImages) {
                    const filePath = path.join(uploadDir, file.originalname);
                    fs.writeFileSync(filePath, file.buffer);
    
                    const fileDoc = await productFileModel.create({
                        product: existingProduct._id,
                        fileName: file.originalname,
                        fileType: file.mimetype.split('/')[0] || 'other',
                        filePath: `/uploads/${productId}/${file.originalname}`,
                        fileSize: file.size,
                        isFeaturedImage: 0,
                    });
    
                    savedImageIds.push(fileDoc._id);
                }
    
                productData.productImages = [
                    ...(existingProduct.productImages || []),
                    ...savedImageIds
                ];
            }
           
            // Handle featured image
            if (req.files?.productFeaturedImage?.length > 0) {
                const file = req.files.productFeaturedImage[0];
                const filePath = path.join(uploadDir, file.originalname);
                fs.writeFileSync(filePath, file.buffer);
    
                const fileDoc = await productFileModel.create({
                    product: existingProduct._id,
                    fileName: file.originalname,
                    fileType: file.mimetype.split('/')[0] || 'other',
                    filePath: `/uploads/${productId}/${file.originalname}`,
                    fileSize: file.size,
                    isFeaturedImage: 1,
                });
    
                productData.productFeaturedImage = fileDoc._id;
            }

           
           
            // Update/Create product variations
            if (Array.isArray(productVariations)) {
                const variationIds = [];
            
                for (const variationData of productVariations) {
                    console.log('TEST DATA  variationData',typeof variationData)
                    let variation;
            
                    if (variationData._id) {
                        // Get existing variation first
                        const existingVariation = await productVariationModel.findById(variationData._id);
                        
                        if (existingVariation) {
                            // Merge existing data with new data to preserve required fields
                            const mergedData = {
                                ...existingVariation.toObject(),
                                ...variationData,
                                product: productId,
                                updatedAt: new Date()
                            };
            
                            // Remove _id from mergedData to avoid MongoDB error
                            delete mergedData._id;
            
                            // Update with merged data
                            variation = await productVariationModel.findByIdAndUpdate(
                                variationData._id,
                                mergedData,
                                { new: true }
                            );
                        }
                    } else {
                        // For new variations, ensure all required fields are present
                        variation = await productVariationModel.create({
                            ...variationData,
                            product: productId
                        });
                    }
            
                    if (variation) {
                        variationIds.push(variation._id);
                    }
                }
            
                productData.productVariations = variationIds;
            }
            console.log('I am having ')
           
            // Update product
            const updatedProduct = await productModel.findByIdAndUpdate(
                productId,
                { ...productData, updatedAt: new Date() },
                { new: true, runValidators: false }
            );
    
            return updatedProduct;
    
        } catch (error) {
           // console.error('Update product error:', error);
            throw {
                message: error?.message || 'Failed to update product.',
                statusCode: error?.statusCode || 500
            };
        }
    }

    /** Build Query For Product List */
    async buildProductListQuery(req) {
        const query = req.query;
        const conditionArr = [{ isDeleted: false }];

        // For TEst Status
        if (query.status !== undefined) {
            if (query.status === "0" || query.status === 0) {
                conditionArr.push({ status: 0 });
            } else if (query.status === "1" || query.status === 1) {
                conditionArr.push({ status: 1 });
            }
        }

        // Add stock Status filter
        if (query.stockStatus !== undefined) {
            if (query.stockStatus === "in_stock") {
                conditionArr.push({ stockStatus: 'in_stock' });
            } else if (query.stockStatus === "out_of_stock") {
                conditionArr.push({ stockStatus: "out_of_stock" });
            }
        }

        // Add search conditions if 'search_string' is provided
        if (query.search_string !== undefined && query.search_string !== "") {
            conditionArr.push({
                $or: [
                    { name: new RegExp(query.search_string, "i") },
                    { sku: new RegExp(query.search_string, "i") },
                    { slug: new RegExp(query.search_string, "i") },
                    { description: new RegExp(query.search_string, "i") },
                    { shortDescription: new RegExp(query.search_string, "i") }
                ]
            });
        }

        // Filter by supplier if provided
        if (query.supplier) {
            conditionArr.push({ supplier: new mongoose.Types.ObjectId(query.supplier) });
        }
        // Filter by category if provided
        if (query.categories !== undefined) {
            const parsedCategories = JSON.parse(query.categories);
            if (Array.isArray(parsedCategories)) {
                const categoryIds = parsedCategories.map(id => new mongoose.Types.ObjectId(id));
                conditionArr.push({ categories: { $in: categoryIds } });
            }
        }

        // Construct the final query
        let builtQuery = {};
        if (conditionArr.length === 1) {
            builtQuery = conditionArr[0];
        } else if (conditionArr.length > 1) {
            builtQuery = { $and: conditionArr };
        }

        return builtQuery;
    }

    /** Get Product List */
    async productList(query, options) {
        try {
            const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
            const skip = (page - 1) * limit;

            // Build aggregation pipeline
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

                // Optional sort
                { $sort: sort },

                // Project fields
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        sku: 1,
                        defaultPrice: 1,
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
                        featuredImage: {
                            _id: 1,
                            filePath: 1
                        },
                        productImages: {
                            _id: 1,
                            filePath: 1
                        },
                        createdAt: 1,
                        updatedAt: 1
                    }
                },
                // Pagination
                { $skip: skip },
                { $limit: limit }
            ];

            // Run aggregation
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
}

module.exports = new Product();
