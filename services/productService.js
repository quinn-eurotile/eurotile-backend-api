const productModel = require('../models/Product');
const productAttributeModel = require('../models/ProductAttribute');
const productAttributeVariationModel = require('../models/ProductAttributeVariation');
const supplierModel = require('../models/Supplier');
const categoryService = require('./categoryService');

class Product {
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
            const product = await productModel.create(req.body);
            return product;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to create product.',
                statusCode: error?.statusCode || 500
            };
        }
    }

    /** Update Product */
    async updateProduct(req) {
        try {
            const updated = await productModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updated) {
                throw { message: 'Product not found', statusCode: 404 };
            }
            return updated;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to update product.',
                statusCode: error?.statusCode || 500
            };
        }
    }
}

module.exports = new Product();
