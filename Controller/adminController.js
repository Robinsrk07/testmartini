const path = require('path');
const Admin = require('../Model/adminSchema');
const Category = require('../Model/categorySchema')
const Brand = require('../Model/brandSchema')
const Colour = require('../Model/colorSchema')
const Product = require('../Model/productSchema')
const admin = require('../Controller/adminController')
const Size = require('../Model/size')
const Users = require('../Model/userSchema')
const Orders = require('../Model/orderSchema')
const multer = require('multer');
const Coupon = require('../Model/couponSchema');
const CategoryOffer = require('../Model/CategoryofferSchema')
const ProductOffer = require('../Model/ProductOfferSchema')
const Wallet = require('../Model/WalletSchema')



const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.adminEmail) {
      next();
    } else {
      res.redirect('/admin/sign_in');
    }
  };






  const getlogin = async (req, res) => {
    if (!req.session.adminEmail) {
      res.redirect('/admin/sign_in');
    } else {
      try {
        const orders = await Orders.find({});
        const monthlyData = processMonthlyData(orders);
        const yearlyData = processYearlyData(orders);
  
        // Format data for Chart.js
        const chartData = {
          monthly: {
            labels: Object.keys(monthlyData),
            data: Object.values(monthlyData)
          },
          yearly: {
            labels: Object.keys(yearlyData).slice(-5), // Last 5 years
            data: Object.values(yearlyData).slice(-5)
          }
        };
        const bestSellingProducts = await Orders.aggregate([
          { $unwind: "$items" },
          { $group: { _id: "$items.product", totalSold: { $sum: "$items.quantity" } } },
          { $sort: { totalSold: -1 } },
          { $limit: 10 },
          { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "productDetails" } },
          { $unwind: "$productDetails" },
          { $project: { 
            _id: 1, 
            title: "$productDetails.title", 
            totalSold: 1 
          }}
        ]);
    
        // Get best-selling categories
        const bestSellingCategories = await Orders.aggregate([
          { $unwind: "$items" },
          { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "product" } },
          { $unwind: "$product" },
          { $group: { 
            _id: "$product.category", 
            totalSold: { $sum: "$items.quantity" } 
          }},
          { $sort: { totalSold: -1 } },
          { $limit: 10 },
          { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "categoryDetails" } },
          { $unwind: "$categoryDetails" },
          { $project: { 
            _id: 1, 
            name: "$categoryDetails.name", 
            totalSold: 1 
          }}
        ]);
    
        // Get best-selling brands
        const bestSellingBrands = await Orders.aggregate([
          { $unwind: "$items" },
          { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "product" } },
          { $unwind: "$product" },
          { $group: { 
            _id: "$product.brand", 
            totalSold: { $sum: "$items.quantity" } 
          }},
          { $sort: { totalSold: -1 } },
          { $limit: 10 },
          { $lookup: { from: "brands", localField: "_id", foreignField: "_id", as: "brandDetails" } },
          { $unwind: "$brandDetails" },
          { $project: { 
            _id: 1, 
            name: "$brandDetails.name", 
            totalSold: 1 
          }}
        ]);
        console.log(bestSellingBrands);
        console.log(bestSellingProducts);
        console.log(bestSellingCategories);
        
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Clear browser history
      res.removeHeader('Referrer-Policy');
        res.render('dash', {
          chartData: JSON.stringify(chartData),
          currentYear: new Date().getFullYear(),
           bestSellingProducts,
          bestSellingCategories,
         bestSellingBrands
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        next(error)

      }
    }
  };

function processMonthlyData(orders) {
  const monthlyData = {};
  orders.forEach(order => {
    const date = new Date(order.createdAt);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = 0;
    }
    monthlyData[monthYear] += order.totalPayable;
  });
  return monthlyData;
}

function processYearlyData(orders) {
  const yearlyData = {};
  orders.forEach(order => {
    const year = new Date(order.createdAt).getFullYear();
    if (!yearlyData[year]) {
      yearlyData[year] = 0;
    }
    yearlyData[year] += order.totalPayable;
  });
  return yearlyData;
}


const getsign_in =(req,res)=>{
  res.render('admin_login')
}

const sign_in = async (req, res) => {
  try {
      const { email, password } = req.body;

      // Input validation
      if (!email || !password) {
        return res.render('admin_login', { error: 'Invalid email or password' });
      }

      // Check if user exists
      const admin = await Admin.findOne({ email: email });
      if (!admin) {
        return res.render('admin_login', { error: 'Invalid email or password' });
      }

      // Verify password directly (without hashing)
      if (admin.password !== password) {
        return res.render('admin_login', { error: 'Invalid email or password' });
      }
      req.session.adminId = admin._id;
      req.session.adminName = admin.name;
      req.session.adminEmail = admin.email;

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Clear browser history
      res.removeHeader('Referrer-Policy');

      // Redirect to another page after successful login
      res.redirect('/admin/login');
  } catch (error) {
      console.error(error);
      next(error)

  }
};


const getcategory = async (req, res) => {
    try {
      const categories = await Category.find({}).exec();
      categories.forEach((category) => {
        if (category.image) {
          category.image = `data:${category.image.contentType};base64,${category.image.data.toString('base64')}`;
        }
      });
      res.render('category', { categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
      next(error)

        }}




const getaddcategory = (req,res)=>{
    res.render('addcategory')
}
const addcategory =  async (req, res) => {
    const { categoryname } = req.body;
    const image = req.files.image;

    const existingCategory = await Category.findOne({ name: categoryname });
    if (existingCategory) {
      
      return res.status(400).send({ message: 'Category already exists' });
    }
    const category = new Category({
      name: categoryname,
      image: {
        data: image.data,
        contentType: image.mimetype
      }
    });
  
    try {
      await category.save();
      res.redirect('/admin/category')
    } catch (err) {
      console.error(err);
      next(error)

    }
  }
const geteditbyid = async (req, res) => {
    const id = req.params.id
    const category = await Category.findOne({_id : id})
    res.render('edit',{pass : category})
  }
const updatecategory = async (req, res) => {
    const { categoryname } = req.body;
    let image;
    if (req.files && req.files.image) {
        image = {
            data: req.files.image.data,
            contentType: req.files.image.mimetype
        };
    }
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).send({ message: 'Category not found' });
        }

        category.name = categoryname;
        if (image) {
            category.image = image;
        }

        await category.save();

       res.redirect('/admin/category')
    } catch (err) {
        console.error(err);
        next(error)

    }
}
const unlist_cat = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        category.is_list = false;
        await category.save();
       res.redirect('/admin/category')
    } catch (err) {
        console.error(err);
        next(error)

    }
}
const list_cat = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        category.is_list = true;
        await category.save();
        res.redirect('/admin/category')
      } catch (err) {
        console.error(err);
        next(error)

    }
}

const getproducts = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = 5;
      const skip = (page - 1) * limit;

      const totalProducts = await Product.countDocuments({});
      const totalPages = Math.ceil(totalProducts / limit);

      const products = await Product.find({})
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
          .skip(skip)
          .limit(limit)
          .exec();

      res.render('products', { 
          products,
          currentPage: page,
          totalPages: totalPages
      });
  } catch (error) {
      console.error(error);
      next(error)

  }
};


const getaddproduct = async(req,res)=>{

    try{
        const categories = await Category.find({is_list :true})
        const brand = await Brand.find({})
        const colour = await Colour.find({})
        const size   =await Size .find({})

      res.render('addproduct',{categories,brand,colour,size})

    }
    catch(error){
      next(error)

    } 
}






const addproduct = async (req, res) => {

  console.log(req.files);
  console.log(req.body);
  try {
    const { name, category, brand } = req.body;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const variants = [];
    const variantKeys = Object.keys(req.body).filter(key => key.startsWith('variants['));

    variantKeys.forEach(key => {
      const match = key.match(/variants\[(\d+)\]\[(\w+)\](?:\[(\d+)\]\[(\w+)\])?/);
      if (match) {
        const [, variantIndex, field, sqIndex, sqField] = match;
        const variantIdx = parseInt(variantIndex);
        const sqIdx = parseInt(sqIndex || '-1');

        if (!variants[variantIdx]) {
          variants[variantIdx] = { sizeQuantities: [], croppedImages: [] };
        }

        if (sqField) {
          if (!variants[variantIdx].sizeQuantities[sqIdx]) {
            variants[variantIdx].sizeQuantities[sqIdx] = {};
          }
          variants[variantIdx].sizeQuantities[sqIdx][sqField] = req.body[key];
        } else if (field === 'croppedImages') {
          variants[variantIdx][field].push(req.body[key]); // Store cropped image data in an array
        } else {
          variants[variantIdx][field] = req.body[key];
        }
      }
    });

    //console.log('Parsed variants:', JSON.stringify(variants, null, 2));

    if (!variants || !Array.isArray(variants)) {
      return res.status(400).json({ error: 'Variants are required and should be an array' });
    }

    const categoryObj = await Category.findById(category);
    const brandObj = await Brand.findById(brand);

    const productQuery = {
      title: name,
      category: categoryObj._id,
      brand: brandObj._id,
    };

    let product = await Product.findOne(productQuery);

    if (!product) {
      product = new Product({
        title: name,
        category: categoryObj._id,
        brand: brandObj._id,
      });
    }

    for (const variant of variants) {
      // Process other variant data here...
      const colourObj = await Colour.findById(variant.colour);
      const sizeQuantities = variant.sizeQuantities.map(sq => ({
        size: sq.size,
        quantity: sq.quantity,
      }));
      
      const existingVariant = product.variants.find(
        v =>
          v.colour.toString() === colourObj._id.toString() &&
          JSON.stringify(v.sizeQuantities.map(sq => sq.size)) === JSON.stringify(sizeQuantities.map(sq => sq.size))
      );
      
      if (existingVariant) {
        existingVariant.sizeQuantities = existingVariant.sizeQuantities.map(sq => {
          const newSq = sizeQuantities.find(nsq => nsq.size.toString() === sq.size.toString());
          return {
            ...sq,
            quantity: sq.quantity + (newSq ? newSq.quantity : 0),
          };
        });
        existingVariant.price = variant.price;
      } else {
        const newVariant = {
          colour: colourObj._id,
          price: variant.price,
          sizeQuantities: sizeQuantities,
          images: [] // Assuming 'images' is an array in your variant schema
        };
       
        const images =[]
        
        // Process cropped images
        if (variant.croppedImages && Array.isArray(variant.croppedImages) && variant.croppedImages.length > 0) {
          for (const imageBuffer of variant.croppedImages) {
            const imagedata = Buffer.from(imageBuffer.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          
            images.push({imagedata})
            // const image = {

            //   imagedata: imageBuffer,
            //   imagetype: 'image/jpeg',
            // };
           // newVariant.images.push(image); 
          }
        }
        console.log(images);
        newVariant.images = images,
        // Add the processed newVariant to the product
        product.variants.push(newVariant);
        
        
        await product.save();
    // Send the response after all processing is complete
    
    }}
    res.status(200).json({ success: true, message: 'Product added successfully.', redirectUrl: '/admin/products' });

  }
 catch (err) {
    console.error(err);
    next(error)

  }
};

const geteditproduct = async(req,res)=>{
console.log(req.params.id);
        try {
            // Fetch product data by productId
            const product = await Product.findById(req.params.id).populate('category').populate('brand').populate({
                path: 'variants',
                 populate: { path: 'colour sizeQuantities.size   images ' }
             }).exec();

    // console.log(product.variants[0]);
            // Fetch all brands
            const brands = await Brand.find().exec();
    
            // Fetch all categories
            const categories = await Category.find().exec();
    
            // Fetch all colours
            const colours = await Colour.find().exec();
    
            // Fetch all sizes
            const sizes = await Size.find().exec();
    
            // Render the edit product page with fetched data
            res.render('edit_product', {
                productData: product,
                brands: brands,
                categories: categories,
                colours: colours,
                sizes: sizes
            });
        } catch (error) {
            console.error(error);
            next(error)

        }
    }
// const editproduct = async(req,res)=>{
//     console.log(req.body);
// }
const editproduct = async (req, res) => {
  try {
    const { productId, name, category, brand, ...rest } = req.body;

    let product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    product.title = name;
    product.category = category;
    product.brand = brand;

    let imagesByVariant = {};

    if (req.files) {
        Object.keys(req.files).forEach(key => {
            const image = req.files[key];
            const imageArray = Array.isArray(image) ? image : [image];

            for (const img of imageArray) {
                const imagedata = img.data;
                const imagetype = img.mimetype;
                const match = key.match(/variants\[(\d+)\]\[images\]\[(\d+)\]/);
                if (match) {
                    const variantIndex = match[1];
                    const imageIndex = match[2];
                    if (!imagesByVariant[variantIndex]) {
                        imagesByVariant[variantIndex] = [];
                    }
                    imagesByVariant[variantIndex][imageIndex] = { imagedata, imagetype };
                }
            }
        });
    }

 

        // Parse variants from req.body
        const variants = [];
        const variantKeys = Object.keys(rest).filter(key => key.startsWith('variants['));

        variantKeys.forEach(key => {
            const match = key.match(/variants\[(\d+)\]\[(\w+)\](?:\[(\d+)\]\[(\w+)\])?/);
            if (match) {
                const [, variantIndex, field, sqIndex, sqField] = match;
                const variantIdx = parseInt(variantIndex);
                const sqIdx = parseInt(sqIndex);

                if (!variants[variantIdx]) {
                    variants[variantIdx] = { sizeQuantities: [] };
                }

                if (sqField) {
                    if (!variants[variantIdx].sizeQuantities[sqIdx]) {
                        variants[variantIdx].sizeQuantities[sqIdx] = {};
                    }
                    variants[variantIdx].sizeQuantities[sqIdx][sqField] = rest[key];
                } else {
                    variants[variantIdx][field] = rest[key];
                }
            }
        });

        // Check if variants is defined and is an array
        if (!variants || !Array.isArray(variants)) {
            return res.status(400).json({ error: 'Variants are required and should be an array' });
        }

        // Update variants for the product
        for (const [index, variant] of variants.entries()) {
          const colourObj = await Colour.findById(variant.colour);
          const sizeQuantities = variant.sizeQuantities.map(sq => ({
              size: sq.size,
              quantity: sq.quantity
          }));

          if (variant.id) {
              const existingVariant = product.variants.id(variant.id);
              if (existingVariant) {
                  existingVariant.colour = colourObj._id;
                  existingVariant.price = variant.price;
                  existingVariant.sizeQuantities = sizeQuantities;

                  // Handle image updates
                  if (imagesByVariant[index]) {
                      for (let i = 0; i < existingVariant.images.length; i++) {
                          if (imagesByVariant[index][i]) {
                              existingVariant.images[i] = imagesByVariant[index][i];
                          }
                      }
                  }
              } else {
                  return res.status(400).json({ error: `Variant with id ${variant.id} not found` });
              }
          } else {
              // Create a new variant
              const newVariant = {
                  colour: colourObj._id,
                  price: variant.price,
                  sizeQuantities: sizeQuantities,
                  images: imagesByVariant[index] || []
              };
              product.variants.push(newVariant);
          }
      }

      await product.save();
      res.status(200).json({ message: 'Product updated successfully' });
  } catch (err) {
      console.error(err);
      next(error)

  }
};


const unlist_product = async (req, res) => {
  console.log(req.params.id);
  try {
      const product = await Product.findById(req.params.id);
      if (!product) {
          return res.status(404).send({ message: 'Category not found' });
      }
      product.is_list = false;
      await product.save();
      res.redirect('/admin/products')
      
  } catch (err) {
      console.error(err);
      next(error)

  }
}

const list_product = async (req, res) => {
  console.log(req.params.id);
  try {
      const products =await Product.find()
      const product = await Product.findById(req.params.id);
      if (!product) {
        res.redirect('/admin/products')
      }
      product.is_list = true;
      await product.save();
      res.redirect('/admin/products')
  } catch (err) {
      console.error(err);
      next(error)

  }
}


const users=  async (req, res) => {
  try {
    const users = await Users.find({});
   
    res.render('user', { users });
  } catch (error) {
    console.error(error);
    next(error)

  }
}

const block = async(req,res)=>{
  try{
    const users = await Users.findById(req.params.id);
    if(!users){
      return res.render('user',{error: 'user not found'})
    }
    users.is_list = false;
    await users.save();
    res.redirect('/admin/users')
  }
  catch(error){
    next(error)


  }
}
const unblock = async(req,res)=>{
  try{
    const users = await Users.findById(req.params.id);
    if(!users){
      return res.render('user',{error: 'user not found'})
    }
    users.is_list = true;
    await users.save();
    res.redirect('/admin/users')
  }
  catch(error){
    next(error)


  }
}




const logout = (req, res) => {
  if (req.session) {
   
    req.session.adminId = null;
    req.session.adminEmail = null;

   
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
      }

      
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      
      res.removeHeader('Referrer-Policy');

     
      res.redirect('/admin/login');
    });
  } else {
   
    res.redirect('/admin/login');
  }
};


  // const orders = async (req,res)=>{

  //   const orders = await Orders.find()
  //   res.render('admin_orders',{orders})
  // }
  const orders = async (req, res) => {
    try {

       

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 4;
        const skip = (page - 1) * limit;

        const orders = await Orders.find()
            .skip(skip)
            .limit(limit);

        const totalOrders = await Orders.countDocuments();

        res.render('admin_orders', {
            orders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            limit
        });
    } catch (error) {
        console.log(error);
        next(error)

    }
};



  const update_status = async (req, res) => {
    console.log('Request body:', req.body);
    console.log('Request params:', req.params);
  
    const { status } = req.body;
    const { Id: orderId, itemId } = req.params;

    try {
      
      const order = await Orders.findById(orderId);
      if (!order) {
        console.log('Order not found');
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
  
      
      const item = order.items.id(itemId);
      if (!item) {
        console.log('Item not found or item ID not fetched correctly');
        return res.status(404).json({ success: false, error: 'Item not found' });
      }
  
      console.log('Current status:', item.status);
      console.log('New status:', status);
  
      
      if (status === 'Return Approved' && item.status === 'Return Approved') {
        console.log('Item already approved');
        return res.status(200).json({ success: true, message: 'Return already approved' });
      }
      if (status === 'cancelled' && item.status === 'cancelled') {
        console.log('Item already cancelled');
        return res.status(200).json({ success: true, message: 'Item already cancelled' });
      }
      if (status === 'cancelled' && item.status === 'Return Approved') {
        console.log('Item already cancelled');
        return res.status(200).json({ success: true, message: 'Item already cancelled' });
      }
      if (status === 'Return Approved' && item.status === 'cancelled') {
        console.log('Item already cancelled');
        return res.status(200).json({ success: true, message: 'Item already cancelled' });
      }
      console.log("blocked here already cancelled");
      const oldStatus = item.status;
      item.status = status;
      
  
      
      if (status === 'cancelled' && oldStatus !== 'cancelled') {
        const product = await Product.findById(item.product);
        if (!product) {
          console.log('Product not found');
        } else {
          const variant = product.variants.find(v => v.colour.toString() === item.colour.toString());
          if (variant) {
            const sizeQuantity = variant.sizeQuantities.find(sq => sq.size.toString() === item.size.toString());
            if (sizeQuantity) {
              sizeQuantity.quantity += item.quantity;
              await product.save();
              console.log('Product stock updated');
            }
          }
        }
      }
       
      // Save the updated order
        await order.save();
      
  
        res.json({ success: true, message: 'Status updated successfully' });
        } catch (error) {
        console.error('Error updating order status:', error);
        next(error)

    }
    const order = await Orders.findById(orderId);
    const item = order.items.id(itemId);
    console.log(item);

    if (order.paymentMethod == "upi" && order.paymentStatus == "Completed"&& status === 'cancelled') {
      const userId = order.user;
      const walletAmount = item.totalPayable;
  
      try {
          const updatedUser = await Users.findByIdAndUpdate(
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
      } catch (error) {
          console.error('Error updating wallet:', error);
          next(error)

        
      }
  }


  if (status === 'Return Approved') {
    console.log("Return Approved - Updating stock and wallet");
    
    // Update product stock
    const product = await Product.findById(item.product);
    if (!product) {
        console.log('Product not found');
    } else {
        const variant = product.variants.find(v => v.colour.toString() === item.colour.toString());
        if (variant) {
            const sizeQuantity = variant.sizeQuantities.find(sq => sq.size.toString() === item.size.toString());
            if (sizeQuantity) {
                sizeQuantity.quantity += item.quantity;
                await product.save();
                console.log('Product stock updated for return');
            }
        }
    }

    
    const userId = order.user;
    const walletAmount = item.totalPayable;
    try {
        const updatedUser = await Users.findByIdAndUpdate(
            userId,
            { $inc: { wallet_bal: walletAmount } },
            { new: true }
        );
        if (!updatedUser) {
            console.log('User not found');
        } else {
            console.log('User wallet updated successfully');
        }
    } catch (error) {
        console.error('Error updating user wallet:', error);
    }

    
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
        console.log("Creating new wallet document");
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
        description: 'Order amount Refund',
        orderId: order.orderId
    });
    await wallet.save();
    console.log('Wallet document updated successfully');
}}


  const getCoupons = async (req, res) => {
    try {
      const coupons = await Coupon.find();
      res.render('coupons', { coupons });
    } catch (error) {
      res.status(500).send(error.message);
    }
  };
  
  
   const getAddCoupon = async(req, res) => {
    const categories = await Category.find({})
    const products = await  Product.find({})
    res.render('addcoupons',{categories,products});
  };
  
  // Add new coupon
    const addCoupon = async (req, res) => {
    try {
      const newCoupon = new Coupon(req.body);
      await newCoupon.save();
      res.redirect('/admin/coupons');
    } catch (error) {
      res.status(400).send(error.message);
    }
  };
  
  // Render edit coupon form
   const getEditCoupon = async (req, res) => {
    try {
      const coupon = await Coupon.findById(req.params.id);
      res.render('editCoupons', { coupon });
    } catch (error) {
      res.status(400).send(error.message);
    }
  };

  const updateCoupon = async (req, res) => {
    try {
      const {
        code,
        discountValue,
        targetValue,
        minPurchaseValue,
        validFrom,
        validTo,
        isActive
      } = req.body;
  
      
      const updatedCoupon = await Coupon.findOneAndUpdate(
        { code },
        {
          discountValue,
          targetValue,
          minPurchaseValue,
          validFrom,
          validTo,
          isActive: isActive === 'true'
        },
        { new: true, runValidators: true }
      );
  
      if (!updatedCoupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      res.redirect('/admin/coupons');
    } catch (error) {
      console.error("Error updating coupon:", error);
      next(error)

    }
  };
  
  // Delete coupon
  const deleteCoupon = async (req, res) => {
    try {
      await Coupon.findByIdAndDelete(req.params.id);
      res.redirect('/admin/coupons');
    } catch (error) {
      next(error)

    } 
  };


    const offerspage = async(req,res)=>{
      try {
        const categoryoffers = await CategoryOffer.find({}).populate({path: 'category', select :'name'})
        res.render('offerspage',{categoryoffers})
      } 
      catch(error){
        console.log(error);
        next(error)

      }

    }
     const getcreatecategoryoffer = async(req,res)=>{
      const categories = await Category.find()
      res.render('offers',{categories})
     }

     const createcategoryoffer = async (req, res) => {
      try {
        const { name, category, type, value, startDate, endDate } = req.body;
        console.log(req.body);
    
        // Check if an active offer already exists for this category
        const existingOffer = await CategoryOffer.findOne({
          category: category,
          isActive: true
        });
    
        if (existingOffer) {
          // If an offer already exists, send an error response
          return res.status(400).json({ message: "An active offer already exists for this category." });
        }
    
        // If no existing offer, create the new offer
        const newOffer = new CategoryOffer({
          name,
          category,
          type,
          value: parseFloat(value),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isActive: true
        });
    
        await newOffer.save();
        return res.status(201).json({ message: "Category offer created successfully." }); // Return a success response
      } catch (error) {
        next(error)

      }
    };

     const getProductOffer = async(req,res)=>{
       const productoffer = await ProductOffer.find({}).populate({path:'Product',select :'title'})
       console.log(productoffer);
       res.render('ProductOffersPage',{productoffer})

     }

     const getcreateproductoffer  = async (req,res)=>{
      const Products = await Product.find({})
      res.render('createProductOffers',{Products})
     }


     const createproductoffer = async (req, res) => {
      try {
          const { name, product, type, value, startDate, endDate } = req.body;
          console.log(req.body);
  
          
          const existingOfferByName = await ProductOffer.findOne({ name });
          console.log(existingOfferByName);
          if (existingOfferByName) {
              return res.status(400).json({ message: 'Offer with this name already exists.' });
          }
  
         
          const existingActiveOffer = await ProductOffer.findOne({
              Product: product,  
              IsActive: true
          });
  
          console.log('existingoffer', existingActiveOffer);
          if (existingActiveOffer) {
              return res.status(400).json({ message: 'An active offer already exists for this product.' });
          }
  
          const newProductOffer = new ProductOffer({
              name,
              Product: product,  
              type,
              value: parseFloat(value),
              startDate: new Date(startDate),
              endDate: new Date(endDate),
              IsActive: true
          });
  
          console.log("hello");
          await newProductOffer.save();
          res.status(200).json({ message: 'Offer created successfully.' });
      } catch (error) {
          console.log(error);
          next(error)

      }
  };



  const getEditProductOffer = async(req,res)=>{
    const productOffer = await ProductOffer.findById(req.params.id).populate({ path: 'Product', select: 'title' });  
      const products = await Product.find({})
    res.render('editProductoffer',{productOffer,products })
  }

   const EditProductOffer = async(req,res)=>{
    const {value, startDate,endDate,isActive,name} =req.body
      try{
         const update = await ProductOffer.findOneAndUpdate({name:name},{value:value,startDate:startDate,endDate:endDate,isActive:isActive})
         if(!update){
          console.log("updation failed");
         }
         res.status(200).json({ success: true });
      }catch(error){
        console.log(error);
        next(error)
      }

   }

   const deleteProductOffer = async(req,res)=>{
    try{
      const deleteOffer = await ProductOffer.findByIdAndDelete(req.params.id)
      if(!deleteOffer){
        console.log("error on delete product offer");

      }
      res.redirect('/admin/ProductOffersPage')
    } catch(error){
          console.log(error);
          next(error)

    }
   }


   const getEditCategoryOffer = async(req,res)=>{

    try{
     const categories= await Category.find()
     if(!categories){
      console.log("editCategory offer error 1183 admin");
     }
      const categoryOffer = await CategoryOffer.findByIdAndUpdate(req.params.id).populate({path :'category',select : 'name'})
      if(!categoryOffer){
        console.log("category offer cant fetched");
      }
       res.render('editCategoryOffer',{categories,categoryOffer})
    } catch(error){
      console.log(error);
      next(error)

    }

   }

   const editCategoryOffer = async(req,res)=>{
    try{
      const {value ,startDate,endDate,isActive ,name} = req.body
      const updateOffer = await CategoryOffer.findOneAndUpdate({name:name},{value:value,startDate:startDate,endDate:endDate,isActive:isActive})
      if(!updateOffer){
        console.log("error in update categoryoffer updation");
      }
      res.status(200).json({succes:true})
    }
    catch(error){
      console.log(error);
      next(error)

    }
   }




   const deleteCategoryOffer = async(req,res)=>{
    try{
      const deletecategoryOffer = await CategoryOffer.findByIdAndDelete(req.params.id)
      if(!deletecategoryOffer){
        console.log('error on deletecategroy  offer 1220');
      }
      res.redirect('/admin/offers')
    }
    catch(error){
      console.log(error);
      next(error)

    }
   }

     const moment = require('moment');
const { query } = require('express');
const { truncate } = require('fs/promises');

const salesReport = async (req, res) => {
  console.log("datafrom ", req.query);
  const { date, reportType, startDate, endDate } = req.query;
  let start, end, orders, reportTitle;

 // const selectedDate = date ? moment(date) : moment();

  switch (reportType) {
      case 'daily':
        start = startDate;
        end = endDate;
          break;
      case 'weekly':
          start = startDate;
          end = endDate;
          
          break;
      case 'monthly':
        start = startDate;
        end = endDate;
     
          break;
      case 'yearly':
        start = startDate;
        end = endDate;
         
          break;
      case 'custom':
          start =startDate
          end = endDate
         
          break;
         
   }

  const startDateString = start
  const endDateString = end
  console.log(startDateString);
  console.log(endDateString);

  orders = await Orders.find({
      createdAt: { $gte: startDateString, $lte: endDateString }
  }).sort({ createdAt: 1 });
  const countOrders = await Orders.countDocuments({
    createdAt: { $gte: startDateString, $lte: endDateString }
  });
  console.log(countOrders);

  const allTimeOrders = await Orders.find({}).sort({ createdAt: 1 });
  const allcount = await Orders.countDocuments()
  console.log(allcount);

  res.render('salesReport', {
      orders,
      countOrders,
      allcount,
      allTimeOrders, 
      selectedDate:date,
      startDate: start,
      endDate: end,
      reportType,
      reportTitle,
      moment: moment
  });
};


module.exports = {
    getlogin,
    getcategory,
    getaddcategory,
    addcategory,
    geteditbyid,
    updatecategory,
    unlist_cat,
    list_cat,
    getproducts,
    getaddproduct,
    addproduct,
    geteditproduct,
    editproduct,
    getsign_in,
    sign_in,
    logout,
    unlist_product,
    list_product,
    users,
    block,
    unblock,
    orders,
    update_status,
    getCoupons,
    getAddCoupon,
    addCoupon ,
    getEditCoupon,
    updateCoupon,
    deleteCoupon,
    offerspage,
    getcreatecategoryoffer,
    createcategoryoffer,
    getProductOffer,
    getcreateproductoffer,
    createproductoffer,
    salesReport,
    getEditProductOffer,EditProductOffer
    ,deleteProductOffer,
    getEditCategoryOffer,
    editCategoryOffer,
    deleteCategoryOffer
    
  


    };








    