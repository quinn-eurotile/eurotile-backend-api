const router = require('express').Router();
const CategoryController = require('../controllers').CategoryController;
const categoryController = new CategoryController();
const auth = require("../middleware/authMiddleware");
const categoryValidation = require('../validation-helper/category-validate');


/* Categories Management */
router.get('/', auth, categoryController.listCategories);
router.get('/:id', auth, categoryController.getCategory);
router.post('/', auth, categoryValidation.saveCategory, categoryController.saveCategory);
router.put('/:id', auth, categoryValidation.saveCategory, categoryController.saveCategory);
router.delete('/:id', auth, categoryController.deleteCategory);

module.exports = router;
