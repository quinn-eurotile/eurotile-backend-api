const categoryService = require('../services/categoryService');
const commonService = require('../services/commonService');
const constants = require('../configs/constant');
const fs = require('fs').promises;
const path = require('path');

module.exports = class CategoryController {

    /** Get Nested Categories  */
    async getNestedCategories(req, res) {
        try {
            const categories = await categoryService.getNestedCategories(req);
            return res.status(200).json({ data: categories, message: 'Categories fetched successfully' });
        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }

    /** Save Category **/
    async saveCategory(req, res) {
        try {
            let data = { ...req.body, updatedBy: req.user?._id };
            let categoryId = req.method === 'PUT' && req?.params?.id ? req.params.id : null;
            let category = null;
            let oldImagePath = null;

            // For POST, create the category first to get the id
            if (req.method === 'POST') {
                data.createdBy = req?.user?.id;
                category = await categoryService.saveCategory(null, data);
                categoryId = category._id;
            }

            // For PUT, get the id from params and fetch old image path
            if (req.method === 'PUT' && req?.params?.id) {
                categoryId = req.params.id;
                const existingCategory = await categoryService.getCategoryById(categoryId);
                oldImagePath = existingCategory?.image;
            }

            // Handle image upload
            if (req.files && req.files.image && req.files.image.length > 0 && categoryId) {
                const file = req.files.image[0];
                const uploadPath = path.join('uploads', 'categories', String(categoryId));
                await fs.mkdir(uploadPath, { recursive: true });
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const filename = uniqueSuffix + '-' + file.originalname;
                const filepath = path.join(uploadPath, filename);
                await fs.writeFile(filepath, file.buffer);
                data.image = `/${filepath.replace(/\\/g, '/')}`;
                // Update the category with the image path
                if (req.method === 'POST') {
                    await categoryService.saveCategory(categoryId, { image: data.image });
                }
                // If updating, delete the old image after saving new one
                if (req.method === 'PUT' && oldImagePath && oldImagePath !== data.image) {
                    const oldImageFullPath = path.join(process.cwd(), oldImagePath.startsWith('/') ? oldImagePath.slice(1) : oldImagePath);
                    try {
                        await fs.unlink(oldImageFullPath);
                    } catch (err) {
                        // Ignore error if file does not exist
                    }
                }
            }

            if (req.method === 'POST') {
                // Refetch the category to get the updated image path
                category = await categoryService.getCategoryById(categoryId);
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
            return res.status(200).json({ message: 'Category fetch successfully' });
        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }

    /** Get List Of Categories **/
    async categoriesList(req, res) {
        try {
            const query = await categoryService.buildCategoriesListQuery(req);
            const options = { sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit), populate: { path: 'parent', select: '_id name' } };
            const data = await categoryService.categoriesList(query, options);
            return res.status(200).json({ data: data, message: 'Category list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }
    async allCategoriesList(req, res) {
        try {          
            const data = await categoryService.allCategoriesList(); 
            return res.status(200).json({ data: data, message: 'Category list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Update Category Status **/
    async updateCategoryStatus(req, res) {
        try {
            const data = await commonService.updateStatusById(req,'Category','status', [0, 1]);
            return res.status(200).send({ message: 'Category status updated successfully', data: data });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }
};