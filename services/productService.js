const productModel = require('../models/Product');
const productAttributeModel = require('../models/ProductAttribute');
const supplierModel = require('../models/Supplier');
const categoryService = require('./categoryService');

class Product {

    async getProductRawData(req){
        try {
            // Get all suppliers
            const suppliers = await supplierModel.find({ isDeleted: false }).select('_id companyName companyEmail companyPhone');
            // Get all nested categories
            const nestedCategories = await categoryService.getNestedCategories(req);
            // Get all product attributes grouped by type
            const productAttributes = await productAttributeModel.aggregate([
                { $match: { isDeleted: false } },
                {
                    $group: {
                        _id: "$type",
                        attributes: {
                            $push: {
                                _id: "$_id",
                                name: "$name",
                                alias: "$alias",
                                type: "$type",
                                externalId: "$externalId"
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        type: "$_id",
                        attributes: 1
                    }
                }
            ]);
            return {
                nestedCategories,
                suppliers,
                productAttributes: productAttributes.reduce((acc, curr) => {
                    acc[curr.type] = curr.attributes;
                    return acc;
                }, {})
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
                alias: req.body?.alias,
                type: req.body?.type,
                product: req.body?.product ?? null,
                createdBy: req.user?.id || null,
                updatedBy: req.user?.id || null,
            };

            const createdAttribute = await productAttributeModel.create(payload);
            return createdAttribute;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to create product attribute.',
                statusCode: error?.statusCode || 500
            };
        }
    }

    /** Create Query For Product Attribute */
    async buildProductAttributeListQuery(req) {
        const query = req.query;
        const conditionArr = [{ isDeleted: false, },];

        // Add type filter if provided
        if (query.type !== undefined && query.type !== "") {
            conditionArr.push({ type: query.type });
        }

        // Add search conditions if 'search_string' is provided
        if (query.search_string !== undefined && query.search_string !== "") {
            conditionArr.push({
                $or: [
                    { name: new RegExp(query.search_string, "i") },
                    { alias: new RegExp(query.search_string, "i") },
                    { type: new RegExp(query.search_string, "i") },
                ],
            });
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

    /** Get List Of Product Attribute */
    async productAttributeList(query, options) {
        try {
            const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
            const skip = (page - 1) * limit;

            const pipeline = [
                { $match: query },

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
                                    name: 1,
                                    alias: 1,
                                    type: 1,
                                    isDeleted: 1,
                                    // Only include fields needed in UI
                                }
                            }
                        ]
                    }
                },
                {
                    $project: {
                        data: 1,
                        totalDocs: { $ifNull: [{ $arrayElemAt: ["$metadata.totalDocs", 0] }, 0] },
                        statusCounts: 1
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
                prevPage: page > 1 ? page - 1 : null,
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

            // Build updated payload
            const updateData = {
                externalId: req.body?.externalId ?? existingAttribute.externalId,
                name: req.body?.name ?? existingAttribute.name,
                alias: req.body?.alias ?? existingAttribute.alias,
                type: req.body?.type ?? existingAttribute.type,
                product: req.body?.product ?? existingAttribute.product,
                updatedBy: req.user?.id || existingAttribute.updatedBy,
                updatedAt: new Date(),
            };

            const updatedAttribute = await productAttributeModel.findByIdAndUpdate(attributeId, updateData, { new: true });
            return updatedAttribute;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to update product attribute.',
                statusCode: error?.statusCode || 500
            };
        }
    }

    /** Create Product **/
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

    /** Update Product **/
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
