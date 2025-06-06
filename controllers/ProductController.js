const productService = require('../services/productService');
const commonService = require('../services/commonService');

module.exports = class ProductController {

    /** Update Status For Attribute */
    async updateAttributeStatus(req, res) {
        try {
            const data = await commonService.updateStatusById(req, 'ProductAttribute', 'status', [0, 1]);
            return res.status(200).send({ message: 'Attribute status updated successfully', data: data });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    async productMeasurementUnitsAll(req, res) {
        try {
            const model = 'ProductMeasurementUnit';
            const projection = { name: 1, symbol: 1, status: 1, isDeleted: 1 };
            const { page, limit, sortBy, sortOrder, ...filters } = req.query;
            const sort = sortBy ? { [sortBy]: sortOrder === 'desc' ? -1 : 1 } : {};
            const result = await commonService.getAllData(model, { filters, page: Number(page) || 1, limit: Number(limit) || 5000, sort, projection });
            return res.status(200).json({ data: result, message: 'All records get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    };

    /** Get Product Raw Data */
    async getProductRawData(req, res) {
        try {
            const data = await productService.getProductRawData(req);
            return res.status(200).json({ data: data, message: 'Product raw data get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Get Attribute By Their Id */
    async getAttributeById(req, res) {
        try {
            const attributeId = req?.params?.id;
            const data = await productService.getAttributeById(attributeId);
            return res.status(200).json({ message: 'Attribute get successfully', data: data });
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
            // const isUserAssignToCase = await pro.findOne({ case_team: { $in: [userId] } });
            // if (isUserAssignToCase) throw new Error("User is already assigned to another case");
            const product = await commonService.updateIsDeletedById(req, 'ProductAttribute', true);
            return res.status(200).send({ message: 'Product attribute deleted successfully', data: product });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Delete Product variation **/
    async deleteProductVariation(req, res) {
        try {
            const product = await commonService.updateIsDeletedById(req, 'ProductVariation', true);
            return res.status(200).send({ message: 'Product variation deleted successfully', data: product });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }


    /** Create Product **/
    async createProduct(req, res) {
       
        try {
            const product = await productService.createProduct(req);
            return res.status(201).json({ type: "success", message: "Product created successfully", data: product });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Get Product By Id **/
    async getProduct(req, res) {
        try {
            const id = req.params.id;
            const product = await productService.getProductById(id);
            if (!product) return res.status(404).json({ message: 'Product not found' });
            return res.status(200).json({ message: 'Product fetch successfully', data: product });
        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }

    /** Delete Product By Api Request */
    async deleteProduct(req, res) {
        try {
            const product = await commonService.updateIsDeletedById(req, 'Product', true);
            return res.status(200).json({ message: "Product deleted successfully.", data: product });
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
            const product = await commonService.updateStatusById(req, 'Product', 'status', [0, 1]);
            return res.status(200).send({ message: 'Product status updated successfully', data: product });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Get Product List **/
    async productList(req, res) {
        try {
            const query = await productService.buildProductListQuery(req);
            const sortField = req.query.sortBy || '_id';
            const sortOrder = req.query.sortOrder === 1 ? 1 : -1;
            // const newLimit = req.query.all === undefined ? Number(req.query.limit) : 1000000;
            const options = { sort: { [sortField]: sortOrder }, page: Number(req.query.page), limit: Number(req.query.limit) };
            const data = await productService.productList(req, query, options);
            return res.status(200).json({ data: data, message: 'Product list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Get Product List **/
    async exportCsv(req, res) {
        try {
            const data = await productService.exportCsv();
            return res.status(200).json({ data: data, message: 'Product list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    async productListForFrontPage(req, res) {
        try {
            const query = await productService.buildFrontProductListQuery(req);
            const sortField = req?.query?.sortBy || '_id';
            const sortOrder = req.query.sortOrder == '1' ? 1 : -1;
            const options = {  sort: { [sortField]: sortOrder }, page: Number(req.query.page), limit: Number(req.query.limit) };
            const data = await productService.productFrontList(req, query, options);
            return res.status(200).json({ data: data, message: 'Product list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

};