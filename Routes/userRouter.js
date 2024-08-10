const express = require('express');
const router = express.Router();
const user = require('../Controller/userController')
const passport = require('../passport');
const { login } = require('../Controller/adminController');
const User = require('../Model/userSchema'); 
const Order = require('../Model/orderSchema');
const Cart = require('../Model/cartSchema')
const { wishlistCountMiddleware } = require('../middleware/whishlist');
const{notFoundMiddleware} = require('../middleware/error404');
const{errorHandlerMiddleware}  =require('../middleware/error500')



async function cartQuantityMiddleware(req, res, next) {
  if (req.session.passport?.user?.id || req.session.userId) {
      let userId = req.session.passport?.user?.id || req.session.userId;
      try {
          const cart = await Cart.findOne({user: userId});

          console.log("check for quantity");
          if (cart && cart.items) {
              res.locals.totalQuantity = cart.items.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
          } else {
              res.locals.totalQuantity = 0;
          }
      } catch (error) {
          console.error('Error fetching cart quantity:', error);
          res.locals.totalQuantity = 0;
      }
  } else {
      res.locals.totalQuantity = 0;
  }
  next();
}

router.use((req, res, next) => {
   
    let breadcrumbs = [];
  
   
    if (req.originalUrl.includes('login')) {
      breadcrumbs = [
        { text: 'Home', url: '/' },
        { text: 'User', url: '/user' },
        { text: 'Login', url: '/user/login' }
      ];
    } 
    
    else if (req.originalUrl.includes('user_logged')) {
      breadcrumbs = [
        { text: 'Home', url: '/' },
        { text: 'User', url: '/user' },
        { text: 'Logged In', url: '/user/user_logged' }
      ];
    } 
    
    else if (req.originalUrl.includes('product_details')) {
      breadcrumbs = [
        { text: 'Home', url: '/' },
        { text: 'User', url: '/user' },
        { text: 'Product Details', url: req.originalUrl }
      ];
    }
  
    
    res.locals.breadcrumbs = breadcrumbs;
    next();
});

const isAuthenticatedUser = (req, res, next) => {
  if (req.session && req.session.userEmail!=null) {
      next();
  } else {
      res.redirect('/user/login');
  }
};
const checkUserStatus = async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user && !user.is_list) {
        console.log(req.session);
          req.session.userEmail=null
          req.session.userId = null;

          res.redirect('/user/login')
        }
       else {
        next();
      }
    } catch (err) {
      console.error('Error checking user status:', err);
      next(err);
    }
  } else {
    next();
  }
};

router.use(cartQuantityMiddleware);
router.use(wishlistCountMiddleware);

router.use(checkUserStatus);


router.get('/',(req,res)=>{
res.redirect('/user/landingpage')
})


router.get('/user/landingpage',user.gethome)
router.get('/user/login',user.getlogin)
router.post('/user/login',user.login)
router.get('/user/signup',user.getsignup)
router.post('/user/signup',user.signup)
router.get('/user/otp_verification',user.getotppage)
router.post('/user/resend_otp',user.resend_otp)
router.post('/user/otp_validation',user.otp_validation)
router.get('/user/logout',user.logout)
router.get('/user/reset_password',user. reset_password);
router.post('/user/reset_password',user. emailfor_reset);
router.get('/user/reset_password/:token', user.reset_password_form);
router.post('/user/reset_password/:token', user.update_password);
router.get('/user/password-reset-success',user.reset_succses)

router.get('/user/google',
  passport.authenticate('google', { scope: ['profile', 'email'] ,prompt : 'login'})
);




router.get('/user/google_auth',
passport.authenticate('google', { failureRedirect: '/' }),
async (req, res) => {
  const { isNewUser } = req.session.passport.user;
  const user = await User.findById(req.session.passport.user.id);

  console.log(user);

 
  req.session.userEmail = user.email; 
  req.session.isNewUser = isNewUser;

  
  res.redirect('/user/user_logged')
}
);

router.use(isAuthenticatedUser)

router.get('/user/userhome', user.home)
router.post('/user/addedtocart',user.addedtocart)
router.get('/user/cart',user.cart)
router.post('/user/removeitem/:id',user.removeitem)
router.post('/user/update-cart',user.Quantityupdate)
router.get('/user/edit_profile/:id',user.edit_profile)
router.post('/user/update_profile',user.update_profile)
router.get('/user/change_password',user.change_password)
router.post('/user/change_password',user.password)
router.get('/user/getAdress',user.getAdress)
router.get('/user/addAdress',user.addAdress)
router.get('/user/addAdress1',user.addAdress1)
router.post('/user/addAdress',user.addAdressto)
router.post('/user/addAdress1',user.addAdressto1)
router.get('/user/delete/:id',user.removeAddress)
router.get('/user/geteditAddress/:id',user.geteditaddress)           
router.post('/user/editAddress',user.editAddress)
router.get('/user/getcheckout',user.getcheckout)
router.get('/user/getorderSummery',user.getorderSummery),
router.post('/user/upfromOrder',user.upfromOrder)
router.post('/user/createOrder',user.createOrder);
router.get('/user/orderSucces',user.orderSucces)
router.get('/user/show_orders',user.show_orders)
router.get('/user/cancel_order/:Id/:itemId',user.cancel_order)
router.get('/user/cancelled',user.order_denied)
router.get('/user/paymentFail',user.paymentFail)
router.post('/user/verifyPayment', user.verifyPayment);
router.get('/user/return-item/:orderId/:itemId',user.getreturn );
router.get('/user/verify-Payment', user.reverifyPayment)
router.post('/user/submit-return',user.returnsubmission,)
router.post('/user/apply-coupon', user.applyCoupon);
router.post('/user/remove-coupon', user.removeCoupon);
router.get('/user/wishlist/:id',user.Wishlist)
router.get('/user/getwishlist',user.getwishlist)
router.post('/user/removefromwishlist',user.removewishitem)
router.get('/user/wallet',user.wallet),
router.get('/user/order_details/:id',user.order_detial)
router.get('/user/pay/:orderId', user.resumePayment);
router.get('/user/walletBalance',user.walletBalance);
router.get('/user/user_logged',user.user_loggedhome)
router.get('/user/product_detials/:id',user.product_detials)

router.use(notFoundMiddleware);
router.use(errorHandlerMiddleware);



module.exports = router
