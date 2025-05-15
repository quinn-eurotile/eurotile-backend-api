const router = require('express').Router();
const ProductController = require('../controllers').ProductController;
const productController = new ProductController();
const auth = require("../middleware/authMiddleware");
const productValidation = require('../validation-helper/product-validate');


/* Product Management */
router.post('/', auth, productController.createProduct);
router.put('/:id', auth, productController.updateProduct);
router.patch('/:id/status', auth, productController.updateProductStatus);
router.get('/raw/data', auth, productController.getProductRawData);
/*router.delete('/:id', auth, productController.deleteTax); */


/* These routes are for product attributes */
router.post('/attribute', auth, productValidation.saveAttribute, productController.createProductAttribute);
router.put('/attribute/:id', auth, productValidation.saveAttribute, productController.updateProductAttribute);
router.delete('/attribute/:id', auth, productController.deleteProductAttribute);
router.get('/attribute', auth, productController.productAttributeList);
router.get('/attribute/:id', auth, productController.getAttributeById);

module.exports = router;
