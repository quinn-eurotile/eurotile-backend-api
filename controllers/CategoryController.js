const categoryService = require('../services/categoryService');
const mongoose = require('mongoose');
const constants = require('../configs/constant');

module.exports = class AdminController {

    /** Save Category **/
    async saveCategory(req, res) {
        try {
            const data = { ...req.body, updatedBy: req.user?._id };

            if (req.method === 'POST') {
                data.createdBy = req.user?._id;
                const category = await categoryService.saveCategory(null, data);
                return res.status(201).json({  data: category, message: 'Category saved successfully' });
            }
            if (req.method === 'PUT' && req.params.id) {
                const categoryId = req.params.id;
                const updated = await categoryService.saveCategory(categoryId, data);
                if (!updated) {
                    return res.status(404).json({ success: false, message: 'Category not found' });
                }
    
                return res.status(201).json({  data: updated, message : 'Category updated successfully' });
            }
            throw { message: 'Method not allowed' , statusCode: 405 };

        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }


    async deleteCategory(req, res) {
        try {
            const id = req.params.id;
            const deleted = await categoryService.deleteCategory(id);
            if (!deleted) return res.status(404).json({ message: 'Category not found' });
            res.json({  message: 'Category deleted' });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async getCategory(req, res) {
        try {
            const id = req.params.id;
            const category = await categoryService.getCategoryById(id);
            if (!category) return res.status(404).json({ message: 'Category not found' });
            res.json({  data: category });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async listCategories(req, res) {
        try {
            const query = {};
            if (req.query.status) query.status = req.query.status === 'true';
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10
            };
            const result = await categoryService.listCategories(query, options);
            res.json({  data: result });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
};