const productService = require('../services/productService');
const commonService = require('../services/commonService');

module.exports = class ProductController {
    
    /** Get Product Raw Data */
    async getProductRawData(req, res) {
        try {
            const data = await productService.getProductRawData(req);
            return res.status(200).json({ data: data, message: 'Product raw data get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Get Product attribute List **/
    async productAttributeList(req, res) {
        try {
            const query = await productService.buildProductAttributeListQuery(req);
            const options = { sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit) };
            const data = await productService.productAttributeList(query, options);
            return res.status(200).json({ data: data, message: 'Product attribute list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Create Product attribute */
    async createProductAttribute(req, res) {
        try {
            const data = await productService.createProductAttribute(req);
            return res.status(201).json({ type: "success", message: "Product attribute created successfully", data: data, });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Update Product attribute */
    async updateProductAttribute(req, res) {
        try {
            const data = await productService.updateProductAttribute(req);
            return res.status(200).json({ type: "success", message: "Product attribute updated successfully", data: data, });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Delete Product attribute **/
    async deleteProductAttribute(req, res) {
        try {
            const product = await commonService.updateIsDeletedById(req, 'ProductAttribute', true);
            return res.status(200).send({ message: 'Product attribute deleted successfully', data: product });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Create Product **/
    async createProduct(req, res) {
        try {
            const product = await productService.createProduct(req);
            return res.status(201).json({ type: "success", message: "Product created successfully", data: product, });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Update Product **/
    async updateProduct(req, res) {
        try {
            const product = await productService.updateProduct(req);
            return res.status(200).json({ type: "success", message: "Product updated successfully", data: product, });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Update Product Status **/
    async updateProductStatus(req, res) {
        try {
            const product = await commonService.updateStatusById(req, 'Product', [0, 1]);
            return res.status(200).send({ message: 'Product status updated successfully', data: product });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }


};