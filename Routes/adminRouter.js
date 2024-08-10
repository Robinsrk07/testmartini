
const express = require('express');
const router = express.Router();
const{notFoundMiddleware} = require('../middleware/error404');
const{errorHandlerMiddleware}  =require('../middleware/error500')


const admin = require('../Controller/adminController')


const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.adminEmail) {
      next();
    } else {
      res.redirect('/admin/sign_in');
    }
  };




// Admin routes
router.get('/', (req, res) => {
    res.redirect('/admin/login');
});

router.get('/login',admin.getlogin);
//router.post('/login',admin.login);
router.get('/sign_in',admin.getsign_in)
router.post('/sign_in',admin.sign_in)

router.use(isAuthenticated);


router.get('/category',admin.getcategory);
router.get('/addcategory',admin.getaddcategory)
router.post('/addcategory',admin.addcategory);
router.get('/edit/:id',admin.geteditbyid);
router.post('/updatecategory/:id',admin.updatecategory);
router.get('/unlist_cat/:id',admin.unlist_cat);
router.get('/list_cat/:id',admin.list_cat);
router.get('/products',admin.getproducts);
router.get('/addproduct',admin.getaddproduct)
router.post('/addproduct',admin.addproduct );
router.get('/editproduct/:id',admin.geteditproduct)
router.put('/editproduct',admin.editproduct)
router.get('/logout',admin.logout)
router.get('/unlist_product/:id',admin.unlist_product)
router.get('/list_product/:id',admin.list_product)
router.get('/users',admin.users)
router.get('/block/:id',admin.block),
router.get('/unblock/:id',admin.unblock)
router.get('/orders',admin.orders)
router.post('/update-order-status/:Id/:itemId',admin.update_status)
router.get('/coupons', admin.getCoupons);
router.get('/addcoupon', admin.getAddCoupon);
router.post('/addcoupon', admin.addCoupon);
router.get('/offers', admin.offerspage);
router.get('/create-category-offer',admin.getcreatecategoryoffer);
router.post('/create-category-offer',admin.createcategoryoffer);
router.get('/ProductOffersPage',admin.getProductOffer);
router.get('/create-product-offer',admin.getcreateproductoffer);
router.post('/createproductoffer',admin.createproductoffer)
router.get('/SalesReport',admin.salesReport)
router.get('/getEditCoupon/:id',admin.getEditCoupon)
router.post('/updatecoupon',admin.updateCoupon)
router.get('/deleteCoupon/:id',admin.deleteCoupon)
router.get('/getEditProductOffer/:id',admin.getEditProductOffer)
router.post('/EditProductOffer',admin.EditProductOffer)
router.post('/deleteProductOffer/:id',admin.deleteProductOffer)
router.get('/geteditCategoryOffer/:id',admin.getEditCategoryOffer)
router.post('/editCategoryOffer',admin.editCategoryOffer)
router.post('/deleteCategoryOffer/:id',admin.deleteCategoryOffer)


router.use(notFoundMiddleware);
router.use(errorHandlerMiddleware);

    
   


module.exports = router


