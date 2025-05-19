const router = require('express').Router();
const ProductController = require('../controllers').ProductController;
const productController = new ProductController();
const auth = require("../middleware/authMiddleware");
const productValidation = require('../validation-helper/product-validate');
const multer = require("multer");
const upload = multer(); // If you haven't set a custom storage yet

/* Product Management */
router.post('/', upload.fields([{ name: 'productImages', maxCount: 10 }, { name: 'productFeaturedImage', maxCount: 1 }]), auth, productController.createProduct);
router.get('/', multer().any(), auth, productController.productList);
router.put('/:id', upload.fields([{ name: 'productImages', maxCount: 10 }, { name: 'productFeaturedImage', maxCount: 1 }]), auth, productController.updateProduct);
router.patch('/:id/status', multer().any(), auth, productController.updateProductStatus);
router.get('/raw/data', multer().any(), auth, productController.getProductRawData);
router.delete('/:id', multer().any(),auth, productController.deleteProduct);
router.get('/:id', multer().any(), auth, productController.getProduct);


/* These routes are for product attributes */
router.post('/attribute', multer().any(), auth, productValidation.saveAttribute, productController.createProductAttribute);
router.put('/attribute/:id', multer().any(), auth, productValidation.saveAttribute, productController.updateProductAttribute);
router.delete('/attribute/:id', multer().any(), auth, productController.deleteProductAttribute);
router.get('/attribute/list', multer().any(), auth, productController.productAttributeList);
router.get('/attribute/:id', multer().any(), auth, productController.getAttributeById);
router.patch('/attribute/:id/status', multer().any(), auth, productController.updateAttributeStatus);


/* These routes are for product measurments */
router.get('/measurement-units/all', multer().any(), auth, productController.productMeasurementUnitsAll);

module.exports = router;
