const categoryService = require('../services/categoryService');
const mongoose = require('mongoose');
const constants = require('../configs/constant');

module.exports = class AdminController {

    /** Save Category **/
    async saveCategory(req, res) {
        try {
            const data = { ...req.body, updatedBy: req.user?._id };
            if (req.method === 'POST') {
                data.createdBy = req?.user?.id;
                const category = await categoryService.saveCategory(null, data);
                return res.status(201).json({ data: category, message: 'Category saved successfully' });
            }
            if (req.method === 'PUT' && req?.params?.id) {
                data.updatedBy = req?.user?.id;
                const updated = await categoryService.saveCategory(req.params.id, data);
                if (!updated) {
                    return res.status(404).json({ success: false, message: 'Category not found' });
                }
                return res.status(201).json({ data: updated, message: 'Category updated successfully' });
            }
            throw { message: 'Method not allowed', statusCode: 405 };

        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }

    /** Delete Category  **/
    async deleteCategory(req, res) {
        try {
            const id = req.params.id;
            const deleted = await categoryService.deleteCategory(id);
            if (!deleted) return res.status(404).json({ message: 'Category not found' });
            return res.status(200).json({ message: 'Category deleted successfully' });
        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }

    /** Get Category By Id **/
    async getCategory(req, res) {
        try {
            const id = req.params.id;
            const category = await categoryService.getCategoryById(id);
            if (!category) return res.status(404).json({ message: 'Category not found' });
            res.json({ data: category });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    /** Get List Of Categories **/
    async categoriesList(req, res) {
        try {
            const query = await categoryService.buildCategoriesListQuery(req);
            const options = { sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit) };
            const teamMembers = await categoryService.categoriesList(query, options);
            return res.status(200).json({ data: teamMembers, message: 'Category list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }
};