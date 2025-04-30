const router = require('express').Router();
const CategoryController = require('../controllers').CategoryController;
const categoryController = new CategoryController();
const auth = require("../middleware/authMiddleware");
const categoryValidation = require('../validation-helper/category-validate');


/* Categories Management */
router.post('/', auth, categoryValidation.saveCategory, categoryController.saveCategory);
router.put('/:id', auth, categoryValidation.saveCategory, categoryController.saveCategory);
router.get('/', auth, categoryController.categoriesList);
router.get('/:id', auth, categoryController.getCategory);
router.delete('/:id', auth, categoryController.deleteCategory);

module.exports = router;
