const express = require('express');
 
// const validateCart = require('../validation-helper/cart-validate');
const {
  getCartController,
  saveCartController,
  deleteCartController
} = require('../controllers/cartController');

const router = express.Router();

router.get(
  '/:userId' ,
  getCartController
);

router.post('/',  saveCartController);

router.delete(
  '/:userId', 
  deleteCartController
);

module.exports = router;
