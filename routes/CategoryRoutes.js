const router = require('express').Router();
const CategoryController = require('../controllers').CategoryController;
const categoryController = new CategoryController();
const auth = require("../middleware/authMiddleware");
const categoryValidation = require('../validation-helper/category-validate');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });


/* Categories Management */
router.post('/', auth, upload.fields([{ name: 'image', maxCount: 1 }]), categoryValidation.saveCategory, categoryController.saveCategory);
router.put('/:id', auth, upload.fields([{ name: 'image', maxCount: 1 }]), categoryValidation.saveCategory, categoryController.saveCategory);
router.patch('/:id/status', auth, categoryController.updateCategoryStatus);
router.get('/', auth, categoryController.categoriesList);
router.get('/:id', auth, categoryController.getCategory);
router.get('/nested/wise', auth, categoryController.getNestedCategories);
router.delete('/:id', auth, categoryController.deleteCategory);
router.get('/cate/all', categoryController.allCategoriesList);

module.exports = router;
