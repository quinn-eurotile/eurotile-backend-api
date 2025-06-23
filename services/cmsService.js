const categoryService = require('./categoryService');
const productService = require('./productService');
const productVariationModel = require('../models/ProductVariation');

class CmsService {
    async getHomePageData() {
        try {    
            const [categories, featuredProducts, recentProducts] = await Promise.all([
                categoryService.getHomePageCategories({}),
                productService.getProductNamesWithVariations({ isDeleted: false, isFeatured: true }, { sort: { _id: -1 }, page: 1, limit: 10 }),
                productService.getProductNamesWithVariations({ isDeleted: false},  { sort: { _id: -1 }, page: 1, limit: 6 })
            ]);
    
            return { categories, featuredProducts, recentProducts };
        } catch (error) {
            throw {
                message: error?.message || 'Failed to fetch homepage data',
                statusCode: error?.statusCode || 500
            };
        }
    }
}

module.exports = new CmsService(); 