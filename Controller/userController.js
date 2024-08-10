const mongoose = require('mongoose');
const path = require('path');
const Admin = require('../Model/adminSchema');
const Category = require('../Model/categorySchema')
const Brand = require('../Model/brandSchema')
const Colour = require('../Model/colorSchema')
const Product = require('../Model/productSchema')
const Address = require('../Model/AdressSchema')
const User = require('../Model/userSchema')
const Cart = require('../Model/cartSchema')
const admin = require('../Controller/adminController')
const Size = require('../Model/size')
const multer = require('multer');
const sendOTPEmail = require('../middleware/sendOTPEmail');
const { ObjectId } = require('mongodb'); // Import ObjectId from MongoDB
//const AdressSchema = require('../Model/AdressSchema');
const Order = require('../Model/orderSchema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { log } = require('console');
require('dotenv').config();
const Razorpay = require('razorpay');
const Coupon = require('../Model/couponSchema');
const CategoryOffer = require('../Model/CategoryofferSchema')
const ProductOffer = require('../Model/ProductOfferSchema')
const wishlist = require('../Model/wishlistSchema')
const Wallet = require('../Model/WalletSchema');
const { isErrored } = require('stream');







const gethome = async (req, res) => {
    console.log( "testing:",req.query);
    console.log("testing 2:",req.query.categoryid);
    console.log(req.session);
    try {
        const page = req.query.page || 1; 
        const perPage = 8; 
        const email = req.session.userEmail; 
       
           
        const sortType = req.query.sort;
        const categoryid = req.query.categoryid;
        const searchQuery = req.query.q;
  
        console.log("category query:",categoryid);
        console.log("search query:", searchQuery);
  
        // Determine sorting option
        let sortOption = {};
        if (sortType === 'lowToHigh') {
            sortOption = { 'variants.price': 1 };
        } else if (sortType === 'highToLow') {
            sortOption = { 'variants.price': -1 };
        } else if (sortType === 'aToZ') {
            sortOption = { 'title': 1 };
        } else if (sortType === 'zToA') {
            sortOption = { 'title': -1 };
        }
        console.log(sortOption);
        const querycategory ={is_list : true}
        if(categoryid ){
            querycategory.category= categoryid
  
        }
        if (searchQuery) {
            querycategory.$or = [
                { title: { $regex: searchQuery, $options: 'i' } }
            ];
        }
  
        console.log('categoryfiltering:',querycategory);
  
        const products = await Product.find(querycategory)
            .populate({
                path: 'category',
                match: { is_list: true }
            })
            .populate('brand')
            .populate({
                path: 'variants',
                populate: [
                    { path: 'colour', model: 'colour' },
                    { path: 'sizeQuantities', populate: { path: 'size', model: 'Size' } },
                    { path: 'images' }
                ],
                options: { limit: 1 } // Limit to only the first variant
            })
            .skip((page - 1) * perPage) 
            .limit(perPage) 
            .sort(sortOption)
            .exec();
  
        const categoryOffers = await CategoryOffer.find({
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });
  
        const productOffers = await ProductOffer.find({
            IsActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });
           console.log("productoffer",productOffers);
           console.log(categoryOffers);
        const productsWithDiscounts = products.map(product => {
            if (!product.variants || product.variants.length === 0) {
                return product;
            }
  
            const variant = product.variants[0]; // Get the first variant
            const categoryOffer = categoryOffers.find(offer => 
                offer.category.toString() === product.category._id.toString()
            );
            const productOffer = productOffers.find(offer => 
                offer.Product.toString() === product._id.toString()
            );
  
            let discountedPrice = variant.price;
            let hasDiscount = false;
            let appliedOffer = null;
  
            // Function to calculate discounted price
            const calculateDiscountedPrice = (price, offer) => {
                if (offer.type === 'percentage') {
                    return price * (1 - offer.value / 100);
                } else if (offer.type === 'fixed') {
                    return Math.max(0, price - offer.value);
                }
                return price;
            };
  
            // Calculate category offer price
            if (categoryOffer) {
                const categoryDiscountedPrice = calculateDiscountedPrice(variant.price, categoryOffer);
                if (categoryDiscountedPrice < discountedPrice) {
                    discountedPrice = categoryDiscountedPrice;
                    console.log(discountedPrice);
                    hasDiscount = true;
                    appliedOffer = 'category';
                    
                }
            }
  
            // Calculate product offer price
            if (productOffer) {
                const productDiscountedPrice = calculateDiscountedPrice(variant.price, productOffer);
                if (productDiscountedPrice < discountedPrice) {
                    discountedPrice = productDiscountedPrice;
                    console.log(discountedPrice);
  
                    hasDiscount = true;
                    appliedOffer = 'product';
                }
            }
  
            return {
                ...product.toObject(),
                variant: {
                    ...variant.toObject(),
                    originalPrice: Math.floor(variant.price),
                    discountedPrice: Math.floor(discountedPrice),
                    hasDiscount: hasDiscount,
                    appliedOffer: appliedOffer
                }
            };
        });
     console.log(productsWithDiscounts);
  
        const totalProducts = await Product.countDocuments({ is_list: true });
        const totalPages = Math.ceil(totalProducts / perPage);
        const categories =await  Category.find()
        console.log('category filter',categories);
        const filteredProducts = productsWithDiscounts.filter(product => product.category !== null);
        res.render('home', { 
            products: filteredProducts, 
              totalPages, 
            sortType, 
            currentPage: page ,
            categories,
            categoryid,
            searchQuery
        });
  
    } catch (error) {
        console.error("home :",error);
        next(error)
    }
  };
  



    //login
    const getlogin = (req, res) => {
        // Set cache-control headers to prevent caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    
        // Clear browser history
        res.removeHeader('Referrer-Policy');
    
        if (!req.session.userEmail) {
            let logoutmsg = '';
            logoutmsg = req.query.logout;
            res.render('user_login', { logout: logoutmsg });
        } else {
            res.redirect('/user/user_logged');
        }
    };

   

    //login
    const login = async (req, res) => {
        try {
            const { email, password } = req.body;
    
            // Input validation
            if (!email || !password) {
                return res.render('user_login', { error: 'Invalid user' });
            }
    
            // Check if user exists
            const user = await User.findOne({ email: email, is_list:true });
           




            if (!user) {
                return res.render('user_login', { error: 'Invalid email or password' });
            }
    
            // Verify password directly (without hashing)
            if (user.password !== password) {
                return res.render('user_login', { error: 'Invalid email or password' });
            }
            req.session.userId = user._id;
            req.session.userName = user.name;
            req.session.userEmail = user.email;
    
            // Set cache-control headers to prevent caching
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
    
            // Clear browser history
            res.removeHeader('Referrer-Policy');
    
            // Redirect to another page after successful login
            res.redirect('/user/user_logged');
        } catch (error) {
            console.error(error);
             next(error);
        }
    };
    

    //sigmup

    const getsignup = (req,res)=>{
        res.render('usersignup')
    }

//sigin up post
     const signup = async (req, res) => {
        
            const { name, email, mobile, password, confirmPassword } = req.body;
            console.log(req.body);
          
            

            try {
                // Check if email or mobile number already exists
                const existingUser = await User.findOne({
                    $or: [
                        { email: req.body.email },
                        { mobile: req.body.mobile }
                    ]
                });
                // if (!existingUser.is_list) {
                //     return res.status(403).json({ success: false, message: 'Your account is blocked.' });
                // }
                if (existingUser) {
                    return res.render('usersignup', { 
                        error: 'Email or mobile number already exists.',
                        name,
                        email,
                        mobile
                    });
        
                }


                    
                    const otp = Math.floor(100000 + Math.random() * 900000);
                            
                    // Send OTP email
                    sendOTPEmail(email, otp);
                   // console.log(email);

                    
                    req.session.otp = otp;
                    
                    
                    res.redirect(`/user/otp_verification?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&mobile=${encodeURIComponent(mobile)}&password=${encodeURIComponent(password)}`);


                    
                    

            }



             catch(error){
                 console.log(error);
                 
                     next(error);
                
            
             }


        }
            const getotppage =(req,res)=>{
                const { email, name, mobile, password } = req.query;


                
                res.render('otp_verification',{email, name, mobile, password})
            }

            const resend_otp =(req,res)=>{
              // console.log(req.body);
                        const { email } = req.body;
                      //console.log(email);
                      
                    // Generate a new OTP
                    const otp = Math.floor(100000 + Math.random() * 900000);
                  
                    // Send the new OTP to the user's email
                    sendOTPEmail(email, otp);
                  
                    // You can also store the new OTP in the database or session for later verification
                  
                    res.json({ message: 'OTP resent successfully' });
                  }
                  
                  
            

                
                                    const otp_validation = async (req, res) => {
                                        const { otp, email, name, mobile, password } = req.body;
                                    
                                        try {
                                            // Verify OTP
                                            if (req.session.otp && req.session.otp === parseInt(otp, 10)) {
                                                // OTP is correct, save the user data to the database
                                                const newUser = new User({
                                                    name: name,
                                                    email: email,
                                                    mobile: mobile,
                                                    password: password // Make sure to hash the password before saving in production
                                                });
                                    
                                                await newUser.save();
                                                req.session.otp = null;

                                                // OTP verified and user saved successfully, redirect to login page
                                                res.status(200).json({ success: true, message: 'OTP verified successfully.', redirectUrl: '/user/login' });
                                            } else {
                                                // OTP is incorrect
                                                res.status(400).json({ success: false, message: 'Invalid OTP.' });
                                            }
                                        } catch (error) {
                                            console.error('Error in otp_validation:', error);

                                            // Catch any other errors and respond accordingly
                                            if (!res.headersSent) {
                                                next(error)
                                            }
                                        }
                                    };
                                    
                                   

                                    const user_loggedhome = async (req, res) => {
                                        console.log( "testing:",req.query);
                                        console.log("testing 2:",req.query.categoryid);
                                        console.log(req.session);
                                        try {
                                            const page = req.query.page || 1; 
                                            const perPage = 8; 
                                            const email = req.session.userEmail; 
                                            const user = await User.findOne({ email: email });
                                            if (!user) {
                                                return res.status(400).json({ message: 'User not found' });
                                            }
                                               
                                            const sortType = req.query.sort;
                                            const categoryid = req.query.categoryid;
                                            const searchQuery = req.query.q;

                                            console.log("category query:",categoryid);
                                            console.log("search query:", searchQuery);

                                            // Determine sorting option
                                            let sortOption = {};
                                            if (sortType === 'lowToHigh') {
                                                sortOption = { 'variants.price': 1 };
                                            } else if (sortType === 'highToLow') {
                                                sortOption = { 'variants.price': -1 };
                                            } else if (sortType === 'aToZ') {
                                                sortOption = { 'title': 1 };
                                            } else if (sortType === 'zToA') {
                                                sortOption = { 'title': -1 };
                                            }
                                            console.log(sortOption);
                                            const querycategory ={is_list : true}
                                            if(categoryid ){
                                                querycategory.category= categoryid

                                            }
                                            if (searchQuery) {
                                                querycategory.$or = [
                                                    { title: { $regex: searchQuery, $options: 'i' } }
                                                ];
                                            }
                                    
                                            console.log('categoryfiltering:',querycategory);

                                            const products = await Product.find(querycategory)
                                                .populate({
                                                    path: 'category',
                                                    match: { is_list: true }
                                                })
                                                .populate('brand')
                                                .populate({
                                                    path: 'variants',
                                                    populate: [
                                                        { path: 'colour', model: 'colour' },
                                                        { path: 'sizeQuantities', populate: { path: 'size', model: 'Size' } },
                                                        { path: 'images' }
                                                    ],
                                                    options: { limit: 1 } // Limit to only the first variant
                                                })
                                                .skip((page - 1) * perPage) 
                                                .limit(perPage) 
                                                .sort(sortOption)
                                                .exec();
                                    
                                            const categoryOffers = await CategoryOffer.find({
                                                isActive: true,
                                                startDate: { $lte: new Date() },
                                                endDate: { $gte: new Date() }
                                            });
                                    
                                            const productOffers = await ProductOffer.find({
                                                IsActive: true,
                                                startDate: { $lte: new Date() },
                                                endDate: { $gte: new Date() }
                                            });
                                               console.log("productoffer",productOffers);
                                               console.log(categoryOffers);
                                            const productsWithDiscounts = products.map(product => {
                                                if (!product.variants || product.variants.length === 0) {
                                                    return product;
                                                }
                                    
                                                const variant = product.variants[0]; // Get the first variant
                                                const categoryOffer = categoryOffers.find(offer => 
                                                    offer.category.toString() === product.category._id.toString()
                                                );
                                                const productOffer = productOffers.find(offer => 
                                                    offer.Product.toString() === product._id.toString()
                                                );
                                    
                                                let discountedPrice = variant.price;
                                                let hasDiscount = false;
                                                let appliedOffer = null;
                                    
                                                // Function to calculate discounted price
                                                const calculateDiscountedPrice = (price, offer) => {
                                                    if (offer.type === 'percentage') {
                                                        return price * (1 - offer.value / 100);
                                                    } else if (offer.type === 'fixed') {
                                                        return Math.max(0, price - offer.value);
                                                    }
                                                    return price;
                                                };
                                    
                                                // Calculate category offer price
                                                if (categoryOffer) {
                                                    const categoryDiscountedPrice = calculateDiscountedPrice(variant.price, categoryOffer);
                                                    if (categoryDiscountedPrice < discountedPrice) {
                                                        discountedPrice = categoryDiscountedPrice;
                                                        console.log(discountedPrice);
                                                        hasDiscount = true;
                                                        appliedOffer = 'category';
                                                        
                                                    }
                                                }
                                    
                                                // Calculate product offer price
                                                if (productOffer) {
                                                    const productDiscountedPrice = calculateDiscountedPrice(variant.price, productOffer);
                                                    if (productDiscountedPrice < discountedPrice) {
                                                        discountedPrice = productDiscountedPrice;
                                                        console.log(discountedPrice);

                                                        hasDiscount = true;
                                                        appliedOffer = 'product';
                                                    }
                                                }
                                    
                                                return {
                                                    ...product.toObject(),
                                                    variant: {
                                                        ...variant.toObject(),
                                                        originalPrice: Math.floor(variant.price),
                                                        discountedPrice: Math.floor(discountedPrice),
                                                        hasDiscount: hasDiscount,
                                                        appliedOffer: appliedOffer
                                                    }
                                                };
                                            });
                                         console.log(productsWithDiscounts);
                                    
                                            const totalProducts = await Product.countDocuments({ is_list: true });
                                            const totalPages = Math.ceil(totalProducts / perPage);
                                            const categories =await  Category.find()
                                            console.log('category filter',categories);
                                            const filteredProducts = productsWithDiscounts.filter(product => product.category !== null);
                                            res.render('loggedhome', { 
                                                products: filteredProducts, 
                                                user, 
                                                totalPages, 
                                                sortType, 
                                                currentPage: page ,
                                                categories,
                                                categoryid,
                                                searchQuery
                                            });
                                    
                                        } catch (error) {
                                            console.error("user_logged :",error);
                                            next(error)
                                        }
                                    };
                                    
                                    const logout = (req, res) => {
                                        if (req.session) {
                                            
                                            const adminEmail = req.session.adminEmail;
                                            const adminId = req.session.adminId;
                                    
                                            
                                            req.session.userId = null;
                                            req.session.userEmail = null;
                                            req.session.userName = null;
                                    
                                            
                                            req.session.adminEmail = adminEmail;
                                            req.session.adminId = adminId;
                                    
                                            
                                            req.session.save((err) => {
                                                if (err) {
                                                    console.error('Error saving session:', err);
                                                }
                                    
                                               
                                                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                                                res.setHeader('Pragma', 'no-cache');
                                                res.setHeader('Expires', '0');
                                    
                                               
                                                res.removeHeader('Referrer-Policy');
                                    
                                            
                                                res.redirect('/user/landingpage?logout=success');
                                            });
                                        } else {
                                            
                                            res.redirect('/user/landingpage?logout=success');
                                        }
                                    };
                              const product_detials = async (req, res) => {
                                try {
                                    const email = req.session.userEmail;
                                    const user = await User.findOne({ email: email });

                                    const products = await Product.findById(req.params.id)
                                        .populate('category')
                                        .populate('brand')
                                        .populate({
                                            path: 'variants',
                                            populate: [
                                                { path: 'colour', model: 'colour' },
                                                { path: 'sizeQuantities', populate: { path: 'size', model: 'Size' } },
                                                { path: 'images' }
                                            ]
                                        })
                                        .exec();

                                    if (!products) {
                                        console.log("Product not found");
                                        return res.status(404).send('Product not found');
                                    }
                                    

                                    const category = await Category.find()
                                    // Fetch active category offers
                                    const categoryOffers = await CategoryOffer.find({
                                        isActive: true,
                                        startDate: { $lte: new Date() },
                                        endDate: { $gte: new Date() },
                                        category: products.category._id
                                    });

                                    // Fetch active product offers
                                    const productOffers = await ProductOffer.find({
                                        IsActive: true,
                                        startDate: { $lte: new Date() },
                                        endDate: { $gte: new Date() },
                                        Product: products._id
                                    });

                                    // Function to calculate discounted price
                                    const calculateDiscountedPrice = (price, offer) => {
                                        if (offer.type === 'percentage') {
                                            return price * (1 - offer.value / 100);
                                        } else if (offer.type === 'fixed') {
                                            return Math.max(0, price - offer.value);
                                        }
                                        return price;
                                    };

                                    // Apply offers to each variant
                                    const productsWithDiscounts = {
                                        ...products.toObject({ virtuals: false }),
                                        variants: products.variants.map(variant => {
                                            let discountedPrice = variant.price;
                                            let appliedOffer = null;

                                            // Check category offer
                                            if (categoryOffers.length > 0) {
                                                const categoryDiscountedPrice = calculateDiscountedPrice(variant.price, categoryOffers[0]);
                                                if (categoryDiscountedPrice < discountedPrice) {
                                                    discountedPrice = categoryDiscountedPrice;
                                                    appliedOffer = 'category';
                                                }
                                            }

                                            // Check product offer
                                            if (productOffers.length > 0) {
                                                const productDiscountedPrice = calculateDiscountedPrice(variant.price, productOffers[0]);
                                                if (productDiscountedPrice < discountedPrice) {
                                                    discountedPrice = productDiscountedPrice;
                                                    appliedOffer = 'product';
                                                }
                                            }

                                            return {
                                                ...variant.toObject(),
                                                originalPrice: variant.price,
                                                discountedPrice: Math.floor(discountedPrice),
                                                hasDiscount: discountedPrice < variant.price,
                                                appliedOffer: appliedOffer
                                            };
                                        })
                                    };

                                    console.log('check:', productsWithDiscounts);

                                    const breadcrumbs = [
                                        { text: 'Home', url: '/user/user_logged' },
                                       // { text: 'User', url: '/user' },
                                        { text: 'Product', url: `/user/product_detials/${products._id}` },
                                        { text: products.title, url: null }
                                    ];

                                    res.render('product_detials', {
                                        products: productsWithDiscounts,
                                        user,
                                        breadcrumbs,
                                        category
                                    });

                                } catch (error) {
                                    console.error("product detial",error);
                                    next(error)
                                }
                            };

                                


                                const home = async (req, res) => {
                                    try {
                                        console.log(req.session);   
                                        let userId;
                                
                                        // Check if the session contains Google authenticated user data
                                        if (req.session.passport && req.session.passport.user) {
                                            userId = req.session.passport.user.id;
                                        } else if (req.session.userId) {
                                            userId = req.session.userId;
                                        } else {
                                            return res.status(400).send('User not authenticated');
                                        }
                                
                                        // Fetch the user from the database
                                        const user = await User.findById(userId);
                                        if (!user) {
                                            return res.status(404).send('User not found')
                                        }
                                    const category = await Category.find()
                                        // Render the profile page with user data
                                        res.render('user_profile', { user,category });
                                    } catch (error) {
                                        console.error('Error fetching user profile:', error);
                                       next(error)
                                    }
                                };

   
    const addedtocart = async (req, res) => {
        console.log("from wishlist:",req.body);
        try {
            const { userId, productId, colourId, sizeId, quantity } = req.body;
    
            // Find the user's cart or create a new one if it doesn't exist
            let cart = await Cart.findOne({ user: userId });
            if (!cart) {
                cart = new Cart({ user: userId, items: [] });
            }
    
            // Find the product
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
    
            // Find the variant index based on the colour
            const variantIndex = product.variants.findIndex(v => v.colour.toString() === colourId);
            if (variantIndex === -1) {
                return res.status(404).json({ error: 'Product variant not found' });
            }
    
            // Check if the item already exists in the cart
            const existingItemIndex = cart.items.findIndex(item =>
                item.product.toString() === productId &&
                item.variantIndex === variantIndex &&
                item.size.toString() === sizeId
            );
    
            if (existingItemIndex > -1) {
                // If the item exists, update the quantity
                const currentQuantity = cart.items[existingItemIndex].quantity;
                const newTotalQuantity = currentQuantity + quantity;
                if (newTotalQuantity > 5) {
                    return res.status(400).json({ error: 'Limit exceeded for purchasing' });
                }
                cart.items[existingItemIndex].quantity = newTotalQuantity;
            } else {
                if (quantity > 5) {
                    return res.status(400).json({ error: 'Maximum quantity of 5 reached' });
                }
                // If the item doesn't exist, add a new item
                cart.items.push({
                    product: productId,
                    variantIndex,
                    colour: colourId,
                    size: sizeId,
                    quantity
                });
            }
    
            // Check for offers and update prices
            for (let item of cart.items) {
                const product = await Product.findById(item.product);
                console.log("product:", product);
                if (!product) {
                    console.warn(`Product not found for id: ${item.product}`);
                    continue;
                }
                const category = product.category;
            
                // Get the correct variant
                const variant = product.variants[item.variantIndex];
                if (!variant) {
                    console.warn(`Variant not found for product ${product._id} at index ${item.variantIndex}`);
                    continue;
                }
            
                // Check for product offer
                const productOffer = await ProductOffer.findOne({
                    Product: item.product,
                    IsActive: true,
                    startDate: { $lte: new Date() },
                    endDate: { $gte: new Date() }
                });
            
                // Check for category offer
                const categoryOffer = await CategoryOffer.findOne({
                    category: category,
                    isActive: true,
                    startDate: { $lte: new Date() },
                    endDate: { $gte: new Date() }
                });
            
                let discount = 0;
                if (productOffer && categoryOffer) {
                    console.log("both");
                    // Choose the bigger discount
                    discount = Math.max(
                        productOffer.type === 'percentage' ? (variant.price * productOffer.value) / 100 : productOffer.value,
                        categoryOffer.type === 'percentage' ? (variant.price * categoryOffer.value) / 100 : categoryOffer.value
                    );
                } else if (productOffer) {
                    console.log("product offer");
                    discount = productOffer.type === 'percentage' ? (variant.price * productOffer.value) / 100 : productOffer.value;
                } else if (categoryOffer) {
                    console.log("category offer");
                    discount = categoryOffer.type === 'percentage' ? (variant.price * categoryOffer.value) / 100 : categoryOffer.value;
                }
            
                console.log("Variant price:", variant.price);
                console.log("Discount:", discount);
            
                const discountedPrice = Math.max(0, variant.price - discount);
                console.log("Discounted price:", discountedPrice);
            
                // Check if discountedPrice is a valid number
                if (!isNaN(discountedPrice) && isFinite(discountedPrice)) {
                    item.discountedPrice = discountedPrice;
                } else {
                    console.warn(`Invalid discounted price for product ${product._id}: ${discountedPrice}`);
                    item.discountedPrice = variant.price; // Fallback to original price
                }
            }
    
            // Save the updated cart
            await cart.save();
    
            const totalQuantity = cart.items.reduce((total, item) => total + item.quantity, 0);
    
            res.status(200).json({ message: 'Item added to cart successfully', totalQuantity: totalQuantity });
        } catch (error) {
            console.error('Error adding item to cart:', error);
            next(error)
        }
    }


    const cart = async (req, res) => {
        try {
            let userId = req.session.passport?.user?.id || req.session.userId;
    
            let cart = await getDetailedCart(userId);
            console.log("cart:",cart);
            
            if (cart) {
                cart = await checkStockForCart(cart);
            }
    
            const totalQuantity = cart ? cartQuantity(cart) : 0;
    
            console.log(totalQuantity);

            const user = await User.findById(userId)
            const category = await Category.find()
            
            res.render('cart', { 
                cart,
                total: cart ? cart.total : 0,
                discountedTotal: cart ? cart.discountedTotal : 0,
                savings: cart ? cart.savings : 0,user,category
              //  totalQuantity: totalQuantity
            });
        } catch (error) {
            console.error('Error fetching detailed cart:', error);
            next(error)
        }
    };
        

             

    async function getDetailedCart(userId) {
        try {
            const cart = await Cart.aggregate([
                // Match the cart for the given user
                { $match: { user: new mongoose.Types.ObjectId(userId) } },
                
                // Unwind the items array to process each item individually
                { $unwind: '$items' },
                
                // Lookup product details
                {
                    $lookup: {
                        from: 'products',  // The name of your products collection
                        localField: 'items.product',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                
                // Unwind the product array (it will be an array with one element after lookup)
                { $unwind: '$product' },
                
                // Lookup size details
                {
                    $lookup: {
                        from: 'sizes',  // The name of your sizes collection
                        localField: 'items.size',
                        foreignField: '_id',
                        as: 'size'
                    }
                },
                
                // Unwind the size array
                { $unwind: '$size' },
                
                // Lookup colour details
                {
                    $lookup: {
                        from: 'colours',  // The name of your colours collection
                        localField: 'items.colour',
                        foreignField: '_id',
                        as: 'colour'
                    }
                },
                
                // Unwind the colour array
                { $unwind: '$colour' },
                
                // Project the fields we need, including the correct variant
                {
                    $project: {
                        cartId: '$_id',
                        userId: '$user',
                        itemId: '$items._id',
                        product: '$product.title',
                        productId: '$product._id',
                        variant: {
                            $arrayElemAt: ['$product.variants', '$items.variantIndex']
                        },
                        size: '$size.size',
                        colour: '$colour.colour',
                        colourCode: '$colour.colour_code',
                        quantity: '$items.quantity',
                        sizeId: '$size._id',
                        colourId: '$colour._id',
                        discountedPrice: '$items.discountedPrice'
                    }
                },
    
                // Add price and image fields
                {
                    $addFields: {
                        price: '$variant.price',
                        image: { $arrayElemAt: ['$variant.images', 0] }
                    }
                },
    
                // Group back into a single document
                {
                    $group: {
                        _id: '$cartId',
                        userId: { $first: '$userId' },
                        items: {
                            $push: {
                                itemId: '$itemId',
                                product: '$product',
                                productId: '$productId',
                                size: '$size',
                                colour: '$colour',
                                colourCode: '$colourCode',
                                quantity: '$quantity',
                                price: '$price',
                                discountedPrice: '$discountedPrice',
                                image: '$image',
                                sizeId: '$sizeId',
                                colourId: '$colourId'
                            }
                        },
                        total: { $sum: { $multiply: ['$price', '$quantity'] } },
                        discountedTotal: {
                            $sum: {
                                $multiply: [
                                    { $ifNull: ['$discountedPrice', '$price'] },
                                    '$quantity'
                                ]
                            }
                        }
                    }
                }
            ]);
    
            if (cart.length > 0) {
                // Calculate savings
                cart[0].savings = cart[0].total - cart[0].discountedTotal;
                if (cart.length > 0) {
                    // Calculate savings
                    cart[0].savings = cart[0].total - cart[0].discountedTotal;
        
                    // Convert image to Base64
                    cart[0].items = cart[0].items.map(item => {
                        if (item.image && item.image.imagedata) {
                            const base64 = Buffer.from(item.image.imagedata.buffer).toString('base64');
                            item.image = `data:${item.image.imagetype};base64,${base64}`;
                        }
                        return item;
                    });
                }
            }
    
            return cart[0]; // Return the first (and should be only) result
        } catch (error) {
            console.error('Error in getDetailedCart:', error);
            throw error;
        }
    }
    
    async function checkStockForCart(cart) {
        for (const item of cart.items) {
            const stock = await Product.findOne(
                {
                    _id: item.productId,
                    'variants': {
                        $elemMatch: {
                            'colour': item.colourId,
                            'sizeQuantities': {
                                $elemMatch: {
                                    'size': item.sizeId
                                }
                            }
                        }
                    }
                },
                {
                    'variants.$': 1
                }
            );
    
            if (stock && stock.variants.length > 0) {
                const variant = stock.variants[0];
                const sizeQuantity = variant.sizeQuantities.find(sq => sq.size.toString() === item.sizeId.toString());
                item.availableStock = sizeQuantity ? sizeQuantity.quantity : 0;
                console.log(item.availableStock);
            } else {
                item.availableStock = 0;
            }
        }
        return cart;
    }
    

 

    function cartQuantity(cart) {
        if (!cart || !cart.items || !Array.isArray(cart.items)) {
            return 0;
        }
        
        return cart.items.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    }
    
    const removeitem = async (req, res) => {
        try {
           // const userId = req.session.userId;
           let userId = req.session.passport?.user?.id || req.session.userId;

            const itemId = req.params.id;
    
            console.log('userId:', userId);
            console.log('itemId:', itemId);
    
            // Convert userId and itemId to ObjectId
            // const userObjectId = new ObjectId(userId);
           // const itemObjectId = new ObjectId(itemId);
    
            // Construct the filter and update objects
            // const filter = { user: userObjectId };
            // const update = {
            //     $pull: {
            //         items: { _id: itemObjectId }
            //     }
            // };
    
            // Perform the update using updateOne
            const updateResult = await Cart.updateOne(
                { user: new ObjectId(userId) }, // Filter by user ID
                { $pull: { items: { _id: new ObjectId(itemId) } } } // Pull the item from the items array
            );
    
            console.log(updateResult);
    
        //     if (updateResult.modifiedCount === 1) {
        //         res.status(200).send('Item successfully removed');
        //     } else {
        //         res.status(404).send('Item not found or could not be removed')
        //     }
         } catch (error) {
             console.error('Error removing item:', error);
             next(error)
         }
    };

    const Quantityupdate = async (req, res) => {
        try {
            //const userId = req.session.userId;
            let userId = req.session.passport?.user?.id || req.session.userId;

            const updatedItems = req.body.updatedItems; // Assuming this is an array of { itemId, newQuantity }
    
            // Fetch the user's cart
            const cart = await Cart.findOne({ user: userId });
    
            if (!cart) {
                return res.status(404).json({ error: 'Cart not found' });
            }
    
            // Iterate over updated items and update quantities
            for (const updatedItem of updatedItems) {
                const item = cart.items.id(updatedItem.itemId);
                if (item) {
                    const newTotalQuantity = updatedItem.newQuantity;
                    if (newTotalQuantity < 1) {
                        return res.status(400).json({ error: 'Minimum quantity of 1 required' });
                    }
                    if (newTotalQuantity > 5) {
                        return res.status(400).json({ error: 'Maximum quantity of 5 reached' });
                    }
                    item.quantity = newTotalQuantity;
                }
            }
    
            // Save the updated cart
            await cart.save();
    
            res.status(200).json({ message: 'Cart updated successfully' });
        } catch (error) {
            console.error('Error updating quantities:', error);
            next(error)
        }
    };
    
    
    const edit_profile = async (req, res) => {
        console.log(req.params);
    
        try {
            // Fetch the user by ID
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).render('404', { message: 'User not found' });
            }
    
            // Fetch categories
            const category = await Category.find();
            if (!category.length) {
                return res.status(404).render('404', { message: 'Categories not found' });
            }
    
            // Render the edit_profile page with the user and category data
            res.render('edit_profile', { user, category });
        } catch (error) {
            console.error('Error fetching data:', error);
           next(error)
        }
    };
      
    
        const update_profile = async(req,res)=>{
        
            const {name,mobile} = req.body
            let errors = {};

            if (!name || name.length < 3) {
                errors.name = 'Name must be at least 3 characters long.';
            }
            if (!mobile || !/^\d{10}$/.test(mobile)) {
                errors.mobile = 'Enter a valid 10-digit mobile number.';
            }
        
            if (Object.keys(errors).length > 0) {
                return res.json({ success: false, errors });
            }


            let userId;
            if (req.session.passport && req.session.passport.user) {
                userId = req.session.passport.user.id;
            } else if (req.session.userId) {
                userId = req.session.userId;
            } else {
                return res.status(400).send('User not authenticated');
            }
    
            // Fetch the user from the database
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).send('User not found')
            }
            try{
            const  userupdate = await User.updateOne(
                {_id:userId}, 
                {$set : {name,mobile}},
              
            )
           // console.log(userupdate);
            if(!userupdate){
                return res.status(404).json({message:" user not found"})

            }
            else{
                res.json({ success: true });
            }
            }
            catch(error){
                 console.log(error);
                 next(error)
            }}
          
        
           const change_password = async(req,res)=>{
            const userId = req.session.passport?.user?.id || req.session.userId;

            const user = await User.findById(userId)
            const category = await Category.find()
              res.render('change_password',{user,category})
           }


           const password = async(req,res)=>{
              // const userId  = req.session.userId;
              const userId = req.session.passport?.user?.id || req.session.userId;

               const {oldpassword,newpassword,confirmPassword} = req.body


               try{
                const user = await User.findById(userId)
                if(!user){
                   return res.json({success :false, errors:{oldpassword :'user not found'}})
                }

               
               if (oldpassword != user.password){
                 return res.json({succes : false,errors:{oldpassword :'password incorrect'}})
              }
               
                const passwordUpdate = await User.updateOne({_id : userId},{$set :{password:newpassword}})
                console.log(passwordUpdate);


                if (passwordUpdate.modifiedCount > 0) {
                    return res.json({ success: true });
                } else {
                    return res.json({ success: false, errors: { newpassword: 'Password update failed.' } });
                }

               }

               catch(error){
                console.error('Error updating password:', error);
                next(error)
               }

           }

           const getAdress = async(req,res)=>{
            let userId = req.session.passport?.user?.id || req.session.userId;

            const user = await User.findById(userId)
            const category = await Category.find()
              console.log(req.session);
              const address = await Address.find({userId : req.session.passport?.user?.id || req.session.userId})
             
               res.render('adress',{address,user,category})
           }
          

           const addAdress = async (req,res)=>{
            res.render('addAdress')
           }
           const addAdress1 = async (req,res)=>{
            res.render('addAdress1')
           }


           const addAdressto =async (req, res) => {
            try {
              // Extract userId from session
            //  const userId = req.session.userId;
            const userId = req.session.passport?.user?.id || req.session.userId;

          
              if (!userId) {
                return res.status(401).json({ success: false, error: 'User not authenticated' });
              }
          
              // Create new address object
              const newAddress = new Address({
                userId: userId,
                name: req.body.name,
                phoneNumber: req.body.phone,
                email: req.body.email,
                address: req.body.address,
                locality: req.body.locality,
                pinCode: req.body.pinCode,
                additionalInfo: req.body.additionalInfo
              });
          
              // Save the address to the database
              await newAddress.save();
          
              res.json({ success: true, message: 'Address saved successfully' });
            } catch (error) {
              console.error('Error saving address:', error);
             next(error)
            }
          };
           const addAdressto1 =async (req, res) => {
            try {
              // Extract userId from session
            //  const userId = req.session.userId;
            const userId = req.session.passport?.user?.id || req.session.userId;

          
              if (!userId) {
                return res.status(401).json({ success: false, error: 'User not authenticated' });
              }
          
              // Create new address object
              const newAddress = new Address({
                userId: userId,
                name: req.body.name,
                phoneNumber: req.body.phone,
                email: req.body.email,
                address: req.body.address,
                locality: req.body.locality,
                pinCode: req.body.pinCode,
                additionalInfo: req.body.additionalInfo
              });
          
              // Save the address to the database
              await newAddress.save();
          
              res.json({ success: true, message: 'Address saved successfully' });
            } catch (error) {
              console.error('Error saving address:', error);
             next(error)
            }
          };

          const removeAddress = async (req, res) => {
            const addressId = req.params.id;
            console.log(addressId);
          
            try {
              const deletedAddress = await Address.findByIdAndDelete(addressId);
              
              if (!deletedAddress) {
                // If no address is found with the given ID, send a 404 response
                return res.status(404).send('Address not found');
              }
              
              res.redirect('/user/getAdress');
            } catch (error) {
              // Log the error for debugging purposes
              console.error('Error deleting address:', error);
          
              // Send a 500 response to the client indicating a server error
             next(error)
            }
          };

        
         

          const geteditaddress = async (req, res) => {
            const addressId = req.params.id;
          
            try {
              const address = await Address.findById(addressId);
          
              if (!address) {
                
                return res.status(404).send('Address not found');
              }
          
              res.render('edit_address', { address });
            } catch (error) {
              
              console.error('Error fetching address:', error);
          
              
             next(error)
            }
          };
          


            const editAddress = async(req,res)=>{
             console.log(req.body);
             const addressId= req.body.addressId

             try{
                changed_address =  await Address.findByIdAndUpdate(addressId,{
                   
                    name: req.body.name,
                    phoneNumber: req.body.phone,
                    email: req.body.email,
                    address: req.body.address,
                    locality: req.body.locality,
                    pinCode: req.body.pinCode,
                    additionalInfo: req.body.additionalInfo
                  });

                if(!changed_address){
                    return res.status(404).json({ error: 'Address not found' });
                }
                res.json({ success: true, message: 'Address updated successfully' });

             }
             catch(error){
                console.error('Error updating address:', error);
                next(error)
             }

          }

       

        const getcheckout = async (req, res) => {
            try {
              //  const userId = req.session.userId;
              const userId = req.session.passport?.user?.id || req.session.userId;

                const total = req.query.total;
                const price = req.query.price;
                const savings = req.query.savings
                console.log('query:',req.query);
                console.log(savings);
        
                // Get the user's cart
                const cart = await Cart.findOne({ user: userId }).populate('items.product');
                console.log("cart :",cart);
        
                if (!cart) {
                    return res.status(404).render('error', { message: 'Cart not found' });
                }
        
                // Initialize arrays to store available and unavailable items
                const availableItems = [];
                const unavailableItems = [];
                let newTotal = 0;
        
                // Check availability for each item in the cart
                for (const item of cart.items) {
                    const product = item.product;
        
                    if (product) {
                        const variant = product.variants.find(v =>
                            v.colour.equals(item.colour) &&
                            v.sizeQuantities.some(sq => sq.size.equals(item.size))
                        );
        
                        if (variant) {
                            const sizeQuantity = variant.sizeQuantities.find(sq => sq.size.equals(item.size));
        
                            if (sizeQuantity && sizeQuantity.quantity >= item.quantity) {
                                availableItems.push(item);
                                newTotal += item.quantity * variant.price;
                            } else {
                                unavailableItems.push({
                                    title: product.title,
                                    reason: sizeQuantity ? 'Insufficient quantity' : 'Size unavailable'
                                });
                            }
                        } else {
                            unavailableItems.push({
                                title: product.title,
                                reason: 'Variant unavailable'
                            });
                        }
                    } else {
                        unavailableItems.push({
                            title: product.title,
                            reason: 'Product no longer exists'
                        });
                    }
                }
        
                // Update the cart with only available items and save
                cart.items = availableItems;
                await cart.save();
        
                // Fetch user addresses
                const addresses = await Address.find({ userId });
                const category = await Category.find();
               
                const user = await User.findById(userId);

        
                // Render the checkout page with the updated cart, total, and unavailable items
                res.render('checkout', {
                    user,
                    savings: savings,
                    price : price,
                    total: total,
                    address: addresses,
                    cart,
                    unavailableItems,category
                });
        
            } catch (error) {
                console.error('Error in getcheckout:', error);
                next(error)
               
            }
        };
        
        
             



        const getorderSummery = async (req, res, next) => {
            console.log('order summer:', req.query);
            const total = req.query.total;
            const price = req.query.price;
            console.log(price);
        
            const savings = req.query.savings
            console.log(savings);
        
            const addressId = req.query.addressId
            console.log(addressId);
            let userId;
            if (req.session.passport && req.session.passport.user) {
                userId = req.session.passport.user.id;
            } else if (req.session.userId) {
                userId = req.session.userId;
            } else {
                return next(new Error('User not found'));
            }
        
            try {
                const address = await Address.findById(addressId);
                if (!address) {
                    throw new Error('Address not found');
                }
        
                const cart = await Cart.findOne({ user: userId })
                    .populate({
                        path: 'items.product',
                        populate: { path: 'variants.colour' }
                    })
                    .populate('items.colour')
                    .populate('items.size');
                if (!cart) {
                    throw new Error('Cart not found');
                }
        
                // Convert image data to Base64
                if (cart && cart.items) {
                    cart.items.forEach(item => {
                        item.product.variants.forEach(variant => {
                            variant.images.forEach(image => {
                                if (image.imagedata) {
                                    image.imageBase64 = `data:${image.imagetype};base64,${image.imagedata.toString('base64')}`;
                                }
                            });
                        });
                    });
                }
        
                const category = await Category.find();
                if (!category || category.length === 0) {
                    throw new Error('Categories not found');
                }
        
                const user = await User.findById(userId);
                if (!user) {
                    throw new Error('User not found');
                }
                const activeCoupons = await Coupon.find({
                    isActive: true,
                    validFrom: { $lte: new Date() },
                    validTo: { $gte: new Date() }
                  });
        
                res.render('orderSummery', { cart, total, address, price, savings, category, user,activeCoupons });
            } catch (error) {
                console.error('Error in getorderSummery:', error);
                next(error);
            }
        }
       

          const upfromOrder  = async (req, res) => {
            try {
               //const userId = req.session.userId;
               const userId = req.session.passport?.user?.id || req.session.userId;

                
                const updatedItems = req.body.updatedItems; // Assuming this is an array of { itemId, newQuantity }
        
                // Fetch the user's cart
                const cart = await Cart.findOne({ user: userId });
        
                if (!cart) {
                    return res.status(404).json({ error: 'Cart not found' });
                }
        
                // Iterate over updated items and update quantities
                for (const updatedItem of updatedItems) {
                    const item = cart.items.id(updatedItem.itemId);
                    if (item) {
                        const newTotalQuantity = updatedItem.newQuantity;
                        if (newTotalQuantity < 1) {
                            return res.status(400).json({ error: 'Minimum quantity of 1 required' });
                        }
                        if (newTotalQuantity > 5) {
                            return res.status(400).json({ error: 'Maximum quantity of 5 reached' });
                        }
                        item.quantity = newTotalQuantity;
                    }
                }
        
                // Save the updated cart
                await cart.save();
        
                res.status(200).json({ message: 'Cart updated successfully' });
            } catch (error) {
                console.error('Error updating quantities:', error);
                next(error)
            }
        };



       
       
        
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        
        const createOrder = async (req, res) => {
            console.log("razorpay:", razorpay);
            const { addressId, paymentMethod } = req.body;
            console.log( "FRO SUMMRY:",req.body);
            const totalPayable = req.body.total;
            const couponamount = req.body.couponDiscount|| 0;
            let offerDiscount =0;

            let userId = req.session.passport?.user?.id || req.session.userId;
        
            if (!userId) {
                return res.status(400).json({ success: false, message: 'User not authenticated' });
            }
        
            try {
                const cart = await Cart.findOne({ user: userId }).populate('items.product items.colour items.size');
                if (!cart || cart.items.length === 0) {
                    return res.status(400).json({ success: false, message: 'Cart is empty' });
                }
        
                const address = await Address.findById(addressId);
                if (!address) {
                    return res.status(400).json({ success: false, message: 'Address not found' });
                }
        
                let updatedOrderItems = [];
                let updatedTotal = 0;
                let unavailableItems = [];
                let allItemsAvailable = true; // Flag to track availability
        
                // Check availability of all items first
                for (const item of cart.items) {
                    try {
                        const product = await Product.findById(item.product._id);
                        if (!product) {
                            unavailableItems.push({ item, reason: 'Product not found' });
                            allItemsAvailable = false;
                            continue;
                        }
        
                        const variant = product.variants[item.variantIndex];
                        if (!variant) {
                            unavailableItems.push({ item, reason: 'Variant not found' });
                            allItemsAvailable = false;
                            continue;
                        }
        
                        const sizeQuantity = variant.sizeQuantities.find(sq => sq.size.toString() === item.size._id.toString());
                        if (!sizeQuantity || sizeQuantity.quantity < item.quantity) {
                            unavailableItems.push({ item, reason: 'Insufficient stock' });
                            allItemsAvailable = false;
                        }
                    } catch (itemError) {
                        console.error('Error processing item:', itemError);
                        unavailableItems.push({ item, reason: 'Processing error' });
                        allItemsAvailable = false;
                    }
                }
        
                if (!allItemsAvailable) {
                    return res.status(400).json({ success: false, message: 'Some items are unavailable', unavailableItems });
                }
        
                
                for (const item of cart.items) {
                    const product = await Product.findById(item.product._id);
                    const variant = product.variants[item.variantIndex];
                    const sizeQuantity = variant.sizeQuantities.find(sq => sq.size.toString() === item.size._id.toString());
                    const productOffer = await ProductOffer.findOne({
                        Product: item.product,
                        IsActive: true,
                        startDate: { $lte: new Date() },
                        endDate: { $gte: new Date() }
                    });
                
                    
                    const  category = product.category
                    console.log(category);
                    const categoryOffer = await CategoryOffer.findOne({
                        category: category,
                        isActive: true,
                        startDate: { $lte: new Date() },
                        endDate: { $gte: new Date() }
                    });
                    console.log(productOffer);
                    console.log(categoryOffer);

                    let discount = 0;
                if (productOffer && categoryOffer) {
                    console.log("both");
                    
                    discount = Math.max(
                        productOffer.type === 'percentage' ? (variant.price * productOffer.value) / 100 : productOffer.value,
                        categoryOffer.type === 'percentage' ? (variant.price * categoryOffer.value) / 100 : categoryOffer.value
                    );
                } else if (productOffer) {
                    console.log("product offer");
                    discount = productOffer.type === 'percentage' ? (variant.price * productOffer.value) / 100 : productOffer.value;
                } else if (categoryOffer) {
                    console.log("category offer");
                    discount = categoryOffer.type === 'percentage' ? (variant.price * categoryOffer.value) / 100 : categoryOffer.value;
                }
            
                console.log("Variant price:", variant.price);
                console.log("Discount:", discount);
            
                const discountedPrice = Math.max(0, variant.price - discount);
                console.log("Discounted price:", discountedPrice);

                let finalQuantity = item.quantity;
                const coupon = parseFloat(req.body.couponDiscount);

                const totalpayble = parseFloat(req.body.total);
                console.log("COUPON:",coupon);

                        console.log("TOTAL:",totalpayble);

                        const total = coupon + totalpayble ;
                        console.log("TOTAL:",total);

                        const couponDiscount = (discountedPrice * finalQuantity /  total )*coupon;
                        console.log("COUPON:",couponDiscount);

                        
                         const paymentforitem= (discountedPrice* finalQuantity) - couponDiscount
                       console.log("hello check offerdiscoun");
                        if( updatedTotal - totalPayable-couponamount>0){
                            offerDiscount = updatedTotal - totalPayable-couponamount
                        }else{
                            offerDiscount = 0
                        }
           console.log( "offerdiscount:" ,offerDiscount);
                    const variantImage = variant.images && variant.images.length > 0 ? variant.images[0] : null;
        
                    updatedOrderItems.push({
                        product: item.product._id,
                        productTitle: product.title,
                        variantIndex: item.variantIndex,
                        colour: item.colour._id,
                        colourName: item.colour.colour,
                        size: item.size._id,
                        sizeName: item.size.size,
                        quantity: finalQuantity,
                        price: variant.price,
                        Discount :discount,
                        DiscountedPrice :discountedPrice,
                        couponDiscount : couponDiscount,
                        totalPayable : paymentforitem,
                        image: variantImage ? {
                            imagedata: variantImage.imagedata,
                            _id: variantImage._id
                        } : null
                    });
                    updatedTotal += variant.price * finalQuantity;
        
                    sizeQuantity.quantity -= finalQuantity;
                    await product.save();
                }
        
                const orderAddress = {
                    name: address.name,
                    phoneNumber: address.phoneNumber,
                    email: address.email,
                    address: address.address,
                    locality: address.locality,
                    pinCode: address.pinCode,
                    additionalInfo: address.additionalInfo
                };
        
                const generateRandomOrderId = () => {
                    return Math.floor(1000000000 + Math.random() * 9000000000);
                };
        
                const formatDate = (timestamp) => {
                    const date = new Date(timestamp);
                    return date.toISOString().split('T')[0];
                };
        
                const orderId = generateRandomOrderId();
                const createdAt = new Date();
                   
              // Add this to your existing createOrder function
                if (paymentMethod === 'wallet') {
                    const wallet = await Wallet.findOne({ user: userId });
                    if (!wallet || wallet.balance < totalPayable) {
                        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
                    }

                    // Deduct amount from wallet
                    wallet.balance -= totalPayable;
                    wallet.transactions.push({
                        amount: totalPayable,
                        type: 'debit',
                        description: `Payment for order ${orderId}`,
                        orderId: orderId
                    });
                    await wallet.save();

                    const order = new Order({
                        orderId: orderId,
                        user: userId,
                        items: updatedOrderItems,
                        address: orderAddress,
                        total: updatedTotal,
                        offerDiscount: offerDiscount,
                        totalPayable: totalPayable,
                        CouponDiscount: couponamount,
                        paymentMethod,
                        createdAt: formatDate(createdAt),
                        paymentStatus: 'completed'  // Set payment status to Paid for wallet payments
                    });

                    await order.save();

                    await Cart.findOneAndUpdate({ user: userId }, { items: [] });

                    return res.status(200).json({
                        success: true, 
                        message: 'Order placed successfully and paid via wallet',
                        order: order
                    });
                }




                if (paymentMethod === 'upi') {
                  
                    const razorpayOrder = await razorpay.orders.create({
                        amount: totalPayable * 100,
                        currency: 'INR',
                        receipt: `order_${orderId}`,
                        payment_capture: 1
                    });
        console.log("razorpayid:",razorpayOrder.id);
                    const order = new Order({
                        orderId: orderId,
                        user: userId,
                        items: updatedOrderItems,
                        address: orderAddress,
                        total: updatedTotal,
                        offerDiscount: offerDiscount,
                        totalPayable : totalPayable,
                        CouponDiscount: couponamount ,
                        paymentMethod,
                        createdAt: formatDate(createdAt),
                        razorpayOrderId: razorpayOrder.id,
                        paymentStatus: 'Pending'
                    });
                    console.log( "upi order:",order);

                    await order.save();
        
                    return res.status(200).json({
                        success: true,
                        message: 'Razorpay order created',
                        order: razorpayOrder,
                        key: process.env.RAZORPAY_KEY_ID,
                        orderDetails: order
                    });
                } else {
                    const order = new Order({
                        orderId: orderId,
                        user: userId,
                        items: updatedOrderItems,
                        address: orderAddress,
                        total: updatedTotal,
                        totalPayable : totalPayable,
                        offerDiscount:offerDiscount,
                        CouponDiscount: couponamount ,
                        paymentMethod,
                        createdAt: formatDate(createdAt)
                    });
        
                    await order.save();
        
                    await Cart.findOneAndUpdate({ user: userId }, { items: [] });
        
                    res.status(200).json({ 
                        success: true, 
                        message: 'Order placed successfully',
                        order: order,
                        unavailableItems: unavailableItems
                    });
                }
            } catch (error) {
                console.error('Error creating order:', error);
                if (error.response) {
                    console.error('Razorpay API response:', error.response.data);
                }
               next(error)
            }
        };
        
        const verifyPayment = async (req, res) => {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
         
            const sign = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSign = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(sign.toString())
                .digest("hex");
        
            if (razorpay_signature === expectedSign) {
                // Payment is successful
                console.log("razorpaycheck");
                try {
                    const order = await Order.findOneAndUpdate(
                        { razorpayOrderId: razorpay_order_id },
                        { 
                            paymentStatus: 'Completed',
                            razorpayPaymentId: razorpay_payment_id
                        },
                        { new: true }
                    );
        

                    console.log("check order:",order);
                    if (!order) {
                        return res.status(404).json({ success: false, message: "Order not found" });
                    }
        
                    // Clear the cart
                    await Cart.findOneAndUpdate({ user: order.user }, { items: [] });
        
                    res.json({ success: true, message: "Payment has been verified and order updated" });
                } catch (error) {
                    console.error('Error updating order:', error);
                    next(error)
                }
            } else {
                // Payment verification failed
                next(error)
            }
        };
        
        const reverifyPayment = async (req, res) => {
            const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.query;
            console.log(req.query);
            
            const sign = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSign = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(sign.toString())
                .digest("hex");
            
            if (razorpay_signature === expectedSign) {
                console.log("razorpaycheck");
                try {
                    const order = await Order.findOneAndUpdate(
                        { razorpayOrderId: razorpay_order_id },
                        {
                            paymentStatus: 'Completed',
                            razorpayPaymentId: razorpay_payment_id
                        },
                        { new: true }
                    );
                    
                    console.log("check order:", order);
                    if (!order) {
                        return  res.redirect("/user/paymentFail")
                        // res.status(404).json({ 
                        //     success: false, 
                        //     message: "Order not found",
                        //     redirect: '/user/paymentFail' 
                        // });
                    }
                    
                    // Clear the cart
                    await Cart.findOneAndUpdate({ user: order.user }, { items: [] });
                    
                    // res.json({ 
                    //     success: true, 
                    //     message: "Payment has been verified and order updated",
                    //     redirect: '/user/orderSucces' 
                    //     // Add redirect URL for success
                    // });
                    res.redirect('/user/orderSucces')
                } catch (error) {
                    // console.error('Error updating order:', error);
                    // res.status(500).json({ 
                    //     success: false, 
                    //     message: "Error updating order status",
                    //     redirect: '/user/paymentFail' // Add redirect URL for server error
                    // });
                     res.redirect("/user/paymentFail")

                }
            } else {
                // Payment verification failed
                // res.status(400).json({ 
                //     success: false, 
                //     message: "Payment verification failed",
                //     redirect: '/user/paymentFail' // Add redirect URL for verification failure
                // });
                res.redirect("/user/paymentFail")

            }
        };
        
        
       



        



        
      const orderSucces = async (req,res)=>{
        let userId = req.session.passport?.user?.id || req.session.userId;

        const user = await User.findById(userId)
        const category = await Category.find()

        res.render('orderSucces',{user,category})
      }
        

   
    const show_orders = async (req, res) => {
        try {
            const userId = req.session.userId || req.session.passport.user.id;
    
            console.log("UserId:", userId);
    
            if (!userId) {
                console.log("User not found");
                return res.status(400).send("User not found");
            }
    
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 4;
            const skip = (page - 1) * limit;
    
            console.log("Page:", page, "Limit:", limit, "Skip:", skip);
    
            const orders = await Order.find({ user: userId })
                .sort({ createdAt: -1 }) // Sort by creation date, newest first
                .skip(skip)
                .limit(limit);
    
            console.log("Orders found:", orders.length);
    
            const totalOrders = await Order.countDocuments({ user: userId });
    
            console.log("Total orders:", totalOrders);
    
            const totalPages = Math.ceil(totalOrders / limit);
            const user = await User.findById(userId);
            const category = await Category.find()
    
            res.render('orders', {
                orders,
                currentPage: page,
                totalPages,
                totalOrders,
                limit,
                user,
                category

            });
        } catch (error) {
            console.log("Error in show_orders:", error);
            next(error)
        }
    };
    
    const order_detial = async(req,res)=>{
        const userId = req.session.userId || req.session.passport.user.id;

        console.log("hello order  detials checkup user cintroller 2036");
        const selected_order = req.params.id;
        console.log(selected_order);
         const order = await Order.findById(selected_order)
         console.log(order);
         const user = User.findById(userId)
         const category =  await Category.find()

         res.render('order_detial',{order,category,user})
    }

      const cancel_order = async (req, res) => {
        const { Id:orderId, itemId } = req.params;
        console.log(req.params);
        
    
        try {
            const order = await Order.findById(orderId);
            console.log(order);
            if (!order) {
                console.log("Order not found - cancel order item");
                return res.status(404).json({ success: false, message: "Order not found" });
            }
    
            // Find the specific item in the order
            const item = order.items.id(itemId);
            if (!item) {
                console.log("Item not found in order");
                return res.status(404).json({ success: false, message: "Item not found in order" });
            }
             console.log(item.status);
            if(item.status != "cancelled"){
            item.status = "cancelled";
    
            // Update the product quantity
            const product = await Product.findById(item.product);
            if (!product) {
                console.log(`Product not found: ${item.product}`);
                return res.status(404).json({ success: false, message: "Product not found" });
            }
    
            const variant = product.variants[item.variantIndex];
            if (!variant) {
                console.log(`Variant not found: ${item.variantIndex} in product: ${item.product}`);
                return res.status(404).json({ success: false, message: "Variant not found" });
            }
    
            // Find the size in the variant's sizeQuantities
            const sizeQuantity = variant.sizeQuantities.find(sq => sq.size.toString() === item.size.toString());
            if (sizeQuantity) {
                sizeQuantity.quantity += item.quantity; // Increment the quantity
                await product.save(); // Save the updated product
            } else {
                console.log(`Size not found: ${item.size} in variant: ${item.variantIndex} of product: ${item.product}`);
                return res.status(404).json({ success: false, message: "Size not found" });
            }
    
           
            order.total -= item.price * item.quantity;
    
           
            await order.save();
            if (order.paymentMethod == "upi" && order.paymentStatus == "Completed") {
                const userId = order.user;
                const walletAmount = item.totalPayable;
                console.log("walletamount:",walletAmount);
            
                try {
                    const updatedUser = await User.findByIdAndUpdate(
                        userId,
                        { $inc: { wallet_bal: walletAmount } },
                        { new: true }
                    );
                    if (!updatedUser) {
                        console.log('User not found');
                        
                    } else {
                        console.log('Wallet updated successfully');
                      
                    }
                    let wallet = await Wallet.findOne({ user: userId });
                    console.log("wallet check");
                    if (!wallet) {
                        console.log("2wallet");
                        wallet = new Wallet({
                            user: userId,
                            balance: 0,
                            transactions: []
                        });
                    }
            
                    
                    wallet.balance += walletAmount;
                    wallet.transactions.push({
                        amount: walletAmount,
                        type: 'credit',
                        description: 'Order cancellation refund',
                        orderId: order.orderId
                        
                    });
            
                    await wallet.save();
            
                    console.log('Wallet updated successfully');
                } 
            
                   
                catch (error) {
                    console.error('Error updating wallet:', error);
                    next(error)
                  
                }
            }
    
            res.status(200).json({ success: true, message: "Item cancelled and quantities updated successfully" });}

            else{
                console.log('already cancelled');
            }
        } catch (error) {
            console.log(error);
           next(error)
        }
    };


   
const reset_password = (req, res) => {
    res.render('reset_password');
}

async function sendResetEmail(email, resetLink) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'robinsyriak07@gmail.com', // Corrected typo
            pass: 'wcmv iktm yggb nmez'
        }
    });

    const mailOptions = {
        from: 'robinsyriak07@gmail.com', // Changed to match auth user
        to: email,
        subject: 'Password Reset',
        text: `Click this link to reset your password: ${resetLink}`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ', info.response);
    } catch (error) {
        console.error('Error sending email: ', error);
        throw error; // Re-throw to be caught in the calling function
    }
}

const emailfor_reset = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if user exists
        const user = await User.findOne({ email });
        console.log(user);
        
        if (!user) {
            return res.status(400).render('error', { message: 'User not found' });
        }
        
        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        
        // Save token to user document with expiration
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();
        
        // Send reset email
        const resetLink = `http://localhost:8080/user/reset_password/${resetToken}`;
        await sendResetEmail(user.email, resetLink);
        console.log('reset mail send');
        
       res.render('email_send');

       console.log('render completed');
    } catch (error) {
        console.error('Error in emailfor_reset: ', error);
        next(error)
    }
}



const reset_password_form = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).render('error', { message: 'Password reset token is invalid or has expired' });
        }

        res.render('reset_password_form', { token: req.params.token });
    } catch (error) {
        console.error(error);
       next(error)
    }
}

const update_password = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).render('error', { message: 'Passwords do not match' });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).render('error', { message: 'Password reset token is invalid or has expired' });
        }

        // Set new password (without hashing)
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        console.log('password reset succesfully');
        return res.redirect('/user/password-reset-success'); // Replace with your desired success page route

        // res.render('message', { message: 'Your password has been changed successfully' });
    } catch (error) {
        console.error(error);
        next(error)
    }
};

      const  order_denied = (req,res)=>{
        res.render('soldoutpage')
      }


      const reset_succses =(req,res)=>{
        res.render('resetpasswordsucces')
      }



      const applyCoupon = async (req, res) => {
        try {
            let userId = req.session.passport?.user?.id || req.session.userId;
            let cart = await getDetailedCart(userId);
            const { couponCode } = req.body;
            console.log("HELLOL");

    
            // Find the coupon
            const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
            console.log(coupon);
            if (!coupon) {
                return res.json({ success: false, message: 'Invalid coupon code' });
            }
    
            // Check if the coupon is valid (date range)
            const now = new Date();
            if (now < coupon.validFrom || now > coupon.validTo) {
                return res.json({ success: false, message: 'Coupon is not valid at this time' });
            }
    
            const discountedTotal = cart.discountedTotal || cart.total;
    
            // Check minimum purchase amount
            if (discountedTotal < coupon.minPurchaseValue) {
                return res.json({
                    success: false,
                    message: `Minimum purchase of $${coupon.minPurchaseValue} required to use this coupon`,
                    minPurchaseValue: coupon.minPurchaseValue
                });
            }
    
            // Calculate discount
            let appliedDiscount;
            if (discountedTotal >= coupon.targetValue) {
                appliedDiscount = coupon.discountValue;
            } else {
                // Prorated discount
                appliedDiscount = Math.floor((discountedTotal / coupon.targetValue) * coupon.discountValue);
            }
    
            // Apply discount
            const newDiscountedTotal = discountedTotal - appliedDiscount;
            console.log(newDiscountedTotal);
            const newSavings = cart.total - newDiscountedTotal;
    
            // Update the cart with the new discounted total
            await Cart.findByIdAndUpdate(cart._id, { discountedTotal: newDiscountedTotal });
    
            res.json({
                success: true,
                message: 'Coupon applied successfully',
                discountedTotal: newDiscountedTotal,
                savings: newSavings,
                appliedDiscount: appliedDiscount
            });
        } catch (error) {
            console.error('Error in applyCoupon:', error);
           next(error)
        }
    };
    
const removeCoupon = async (req, res) => {
    try {
        let userId = req.session.passport?.user?.id || req.session.userId;
        let cart = await getDetailedCart(userId);

        // Reset the discounted total to the original total
        await Cart.findByIdAndUpdate(cart._id, { discountedTotal: cart.total });

        res.json({
            success: true,
            message: 'Coupon removed successfully',
            discountPrice: cart.discountedTotal
        });
    } catch (error) {
        console.error('Error in removeCoupon:', error);
       next(error)
    }
}



const Wishlist = async (req, res) => {
    console.log("wishlist ", req.params);
    try {
        const productId = req.params.id;
        const userId = req.session.passport?.user?.id || req.session.userId;

        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        let userWishlist = await wishlist.findOne({ user: userId });

        if (!userWishlist) {
            userWishlist = new wishlist({
                user: userId,
                products: [productId]
            });
            await userWishlist.save();
            return res.json({ message: "Item added to wishlist", status: "added" });
        }
    
        const productIndex = userWishlist.products.indexOf(productId);
        if (productIndex > -1) {
            // Product exists in wishlist, remove it
            userWishlist.products.splice(productIndex, 1);
            await userWishlist.save();
            res.json({ message: "Item removed from wishlist", status: "removed" });
        } else {
            // Product doesn't exist in wishlist, add it
            userWishlist.products.push(productId);
            await userWishlist.save();
            res.json({ message: "Item added to wishlist", status: "added" });
        }
    } catch (error) {
        console.error(error);
        next(error)
    }
};


const getwishlist = async (req, res) => {
    const userId = req.session.passport?.user?.id || req.session.userId;

    try {

        const username = await User.findById(userId)
        const Wishlist = await wishlist.findOne({ user: userId })
            .populate({
                path: 'products',
                select: 'title variants',
                populate: {
                    path: 'variants',
                    select: 'price images colour sizeQuantities',
                    options: { limit: 1 }, // This will populate only the first variant
                    populate: [
                        { path: 'colour', select: '_id' },
                        { path: 'sizeQuantities', select: 'size quantity', populate: { path: 'size', select: '_id' } }
                    ]
                }
            });

        let wishlistItems = [];

        if (Wishlist && Wishlist.products) {
            wishlistItems = Wishlist.products.map(product => {
                const firstVariant = product.variants[0];
                const firstImage = firstVariant && firstVariant.images && firstVariant.images[0];
                const firstSizeQuantity = firstVariant && firstVariant.sizeQuantities && firstVariant.sizeQuantities[0];

                return {
                    
                    _id: product._id,
                    title: product.title,
                    price: firstVariant ? firstVariant.price : 'N/A',
                    imageUrl: firstImage ? `data:${firstImage.imagetype};base64,${firstImage.imagedata.toString('base64')}` : null,
                    colourId: firstVariant ? firstVariant.colour._id : null,  // Extract only _id
                    sizeId: firstVariant && firstVariant.sizeQuantities[0] ? firstVariant.sizeQuantities[0].size._id : null 
                };
            });
        }
        const user = userId
       // console.log(wishlistItems);

       const category = await Category.find({})

        res.render('wishlist', { wishlistItems,user,username,category });
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        next(error)
    }
};

const removewishitem = async (req, res) => {
    const { userId, productId } = req.body;
    console.log("user:",userId);

    try {
        const userWishlist = await wishlist.findOne({ user: userId });
        if (userWishlist) {
            userWishlist.products = userWishlist.products.filter(product => product.toString() !== productId);
            await userWishlist.save();
            res.status(200).json({ message: 'Product removed from wishlist' });
        } else {
            res.status(404).json({ message: 'Wishlist not found' });
        }
    } catch (error) {
        console.error("Error removing product from wishlist:", error);
        next(error)
    }
}

const getreturn= async (req, res) => {
    const { orderId, itemId } = req.params;
    
  
    const order = await Order.findById(orderId); 
    const item = order.items.find(item => item._id.toString() === itemId);
  
    if (!item) {
      return res.status(404).send('Item not found');
    }
  
    res.render('return', { order, item });
  }

  const returnsubmission = async (req, res) => {
    const { orderId, itemId, returnReason } = req.body;
    console.log(req.body);
    
    try {
        const updatedOrder = await Order.findOneAndUpdate(
            { _id: orderId, 'items._id': itemId },
            { $set: { 'items.$.returnReason': returnReason, 'items.$.status': 'Return Requested' } },
            { new: true } 
        );
        console.log("updatedcheck :", updatedOrder);

        if (!updatedOrder) {
            console.log('Order or item not found');
            return res.status(404).json({ message: 'Order or item not found' });
        }

        console.log('Return reason updated successfully');
        res.status(200).json({ success: true, message: 'Return reason updated successfully', updatedOrder });
    } catch (error) {
        console.error('Error updating return reason:', error);
        next(error)
    }
};


const wallet = async (req, res) => {
    const userId = req.session.passport?.user?.id || req.session.userId;
    try {
        const wallet = await Wallet.findOne({ user: userId })
        const user = await User.findById(userId);
        const category = await Category.find();
        
        if (!wallet) {
            // If wallet doesn't exist, create a new one
            const newWallet = new Wallet({
                user: userId,
                balance: 0,
                transactions: []
            });
            await newWallet.save();
            res.render('wallet', { wallet: newWallet, user, transactions: [] });
        } else {
            res.render('wallet', { 
                category,
                wallet, 
                user, 
                transactions: wallet.transactions.sort((a, b) => b.timestamp - a.timestamp)
            });
        }
    } catch (error) {
        console.error('Error fetching wallet data:', error);
        next(error)
    }
};


const resumePayment = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.paymentStatus !== 'Pending') {
            return res.status(400).json({ success: false, message: 'This order is not pending payment' });
        }

        // Create a new Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: order.totalPayable * 100,
            currency: 'INR',
            receipt: `order_${order.orderId}`,
            payment_capture: 1
        });

        // Update the order with the new Razorpay order ID
        order.razorpayOrderId = razorpayOrder.id;
        order.paymentMethod = 'upi'; // Update payment method to online payment
        await order.save();

        // Render a page with Razorpay payment button
        res.render('payment', {
            orderId: order.orderId,
            razorpayOrderId: razorpayOrder.id,
            amount: order.totalPayable,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Error resuming payment:', error);
       next(error)
    }
};

 const paymentFail = async(req,res)=>{
    res.render('paymentFailed')
 }


 const walletBalance = async(req,res)=>{
    try {
        const userId = req.session.passport?.user?.id || req.session.userId;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User not authenticated' });
        }

        const wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            return res.status(200).json({ balance: 0 });
        }

        res.status(200).json({ balance: wallet.balance });
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
       next(error)
    }
 }



 
module.exports={
    gethome,
    getlogin,
    login,
    getsignup,
    signup,
    getotppage,
    resend_otp,
    otp_validation,
    user_loggedhome,
    logout,
    product_detials,
    home,addedtocart,
    cart,
    removeitem,
    Quantityupdate,
    edit_profile,
    update_profile,
    change_password,
    password,
    getAdress,
    addAdress,
    addAdressto,
    removeAddress,
    geteditaddress,
    editAddress,
    getcheckout,
    getorderSummery,
    upfromOrder,
    createOrder,
    orderSucces,
    show_orders,
    cancel_order,
    reset_password,
    emailfor_reset,
    reset_password_form,
    update_password ,
    order_denied,
    reset_succses,
    verifyPayment,
    reverifyPayment,
    applyCoupon,
    removeCoupon,
    Wishlist,
    getwishlist,
    removewishitem,
    getreturn,
    returnsubmission,
    wallet,
    order_detial ,
    resumePayment,
    paymentFail,
    walletBalance,
    addAdress1,
    addAdressto1 
}















     
        