const categoryModel = require('../models/Category');
const mongoose = require('mongoose');

class Category {
    async buildCategoryTree(categories, parentId = null) {
        try {
            const tree = [];
            
            const filteredCategories = categories
                .filter(cat => String(cat.parent || '') === String(parentId || ''));
            
            for (const cat of filteredCategories) {
                const children = await this.buildCategoryTree(categories, cat._id);
                tree.push({
                    _id: cat._id,
                    name: cat.name,
                    status: cat.status,
                    image: cat.image,
                    children: children,
                });
            }
    
            return tree;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to build category tree',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async getHomePageCategories(req) {
        try {
            const limit = parseInt(req?.query?.limit) || 10; // default limit is 10
    
            const allCategories = await categoryModel
                .find({ isDeleted: false, status: 1 })
                .limit(limit);
    
            return await this.buildCategoryTree(allCategories);
        } catch (error) {
            throw {
                message: error?.message || 'Failed to fetch nested categories',
                statusCode: error?.statusCode || 500
            };
        }
    }
    
    async getNestedCategories(req) {
        try {
            const allCategories = await categoryModel.find({ isDeleted: false, status : 1 }).lean();
            return await this.buildCategoryTree(allCategories);
        } catch (error) {
            throw {
                message: error?.message || 'Failed to fetch nested categories',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async saveCategory(id, data) {
        if (!id) {
            return await categoryModel.create(data);
        } else {
            return await categoryModel.findByIdAndUpdate(id, data, { new: true });
        }
    }

    async deleteCategory(id) {
        try {
            const isAssigned = await categoryModel.findOne({ parent: id, isDeleted: false });
            if (isAssigned) throw new Error("Category is already assigned to another case");
            // Find the user and update the `deleted_at` field
            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw {
                    message: 'Invalid supplier ID',
                    statusCode: 400
                };
            }
            const category = await categoryModel.findById({ _id: id });
            if (!category) throw new Error({ message: 'Category not found', statusCode: 404 });
            category.isDeleted = true;
            return await category.save();
        } catch (error) {
            throw {
                message: error?.message || 'Something went wrong while fetching users',
                statusCode: error?.statusCode || 500
            };
        }
    }



    async getCategoryById(id) {
        return await categoryModel.findById(id).populate('parent');
    }

    async buildCategoriesListQuery(req) {
        const query = req.query;
        const conditionArr = [{ isDeleted: false },];
        if (query.status !== undefined) {
            if (query.status === "0" || query.status === 0) {
                conditionArr.push({ status: 0 });
            } else if (query.status === "1" || query.status === 1) {
                conditionArr.push({ status: 1 });
            }
        }
        // Add search conditions if 'search_string' is provided
        if (query.search_string !== undefined && query.search_string !== "") {
            conditionArr.push({
                $or: [
                    { name: new RegExp(query.search_string, "i") },
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

    async allCategoriesList() {
        try {
            return await categoryModel
                .find({ isDeleted: false }) // optional filter
                .sort({ _id: -1 })          // sort newest first
                .populate('parent', '_id name status');
        } catch (error) {
            throw {
                message: error?.message || 'Failed to update team member status',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async categoriesList(query, options) {
        try {
            return await categoryModel.paginate(query, options);
        } catch (error) {
            throw {
                message: error?.message || 'Failed to update team member status',
                statusCode: error?.statusCode || 500
            };
        }
    }
}



module.exports = new Category();