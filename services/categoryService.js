const categoryModel = require('../models/Category');
const bcrypt = require("bcryptjs");
const helpers = require("../_helpers/common");
const mongoose = require('mongoose');
const constants = require('../configs/constant');

class Category {

    async saveCategory(id, data) {
        if (!id) {
            // CREATE
            return await categoryModel.create(data);
        } else {
            // UPDATE
            return await categoryModel.findByIdAndUpdate(id, data, { new: true });
        }
    }

    async deleteCategory(id) {
        return await categoryModel.findByIdAndDelete(id);
    }

    async getCategoryById(id) {
        return await categoryModel.findById(id).populate('parent');
    }

    async listCategories(query = {}, options = {}) {
        const { page = 1, limit = 10 } = options;
        return await categoryModel.paginate(query, {
            page,
            limit,
            populate: ['parent', 'createdBy', 'updatedBy'],
            sort: { createdAt: -1 }
        });
    }

}

module.exports = new Category();