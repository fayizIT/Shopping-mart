const express = require('express');
const router = express.Router();
const config = require("../config/config")
const userController = require('../controllers/userController');
const couponController = require('../controllers/couponController')
const auth = require("../middleware/auth");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/userImage'))
  },
  filename: (req, file, cb) => {
    const name = Date.now() + '-' + file.originalname;
    cb(null, name)
  }
})
router.get('/signup', auth.isLogOut, userController.loadSignup);
router.post('/signup', userController.insertUser);

router.get('/', userController.loadwelcome);
router.get('/login', auth.isLogOut, userController.loadlogin);
router.post('/login', userController.verifyLogin);
router.get('/home', auth.isLogin, userController.loadindex);
router.get('/logout', auth.isLogin, userController.userLogout);
router.get('/cart', auth.isLogin, userController.getCart);
router.post('/addTocart', auth.isLogin, userController.addToCart);
router.post('/change-product-quantity', userController.changeQuantity);

module.exports = router;

