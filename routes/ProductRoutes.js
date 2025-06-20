const router = require('express').Router();
const ProductController = require('../controllers').ProductController;
const productController = new ProductController();
const auth = require("../middleware/authMiddleware");
const productValidation = require('../validation-helper/product-validate');
const multer = require("multer");
const upload = multer(); // If you haven't set a custom storage yet

/* Product Management */
router.post('/',  upload.any(), auth, productController.createProduct);
router.get('/', multer().any(), auth, productController.productList);
router.get('/front-list', multer().any(), productController.productListForFrontPage);
router.put('/:id', upload.any(), auth, productController.updateProduct);
router.patch('/:id/status', multer().any(), auth, productController.updateProductStatus);
router.get('/raw/data', multer().any(), productController.getProductRawData);
router.delete('/:id', multer().any(),auth, productController.deleteProduct);
router.get('/:id', multer().any(), productController.getProduct);

router.get('/export/csv', multer().any(), auth, productController.exportCsv);


/* These routes are for product attributes */
router.post('/attribute', multer().any(), auth, productValidation.saveAttribute, productController.createProductAttribute);
router.put('/attribute/:id', multer().any(), auth, productValidation.saveAttribute, productController.updateProductAttribute);
router.delete('/attribute/:id', multer().any(), auth, productController.deleteProductAttribute);
router.get('/attribute/list', multer().any(), auth, productController.productAttributeList);
router.get('/attribute/:id', multer().any(), auth, productController.getAttributeById);
router.patch('/attribute/:id/status', multer().any(), auth, productController.updateAttributeStatus);


/** Product variation Routes */
router.delete('/variation/:id', multer().any(), auth, productController.deleteProductVariation);

/* These routes are for product measurments */
router.get('/measurement-units/all', multer().any(), auth, productController.productMeasurementUnitsAll);

module.exports = router;
