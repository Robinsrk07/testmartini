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
      console.error("user_logged :",error);
      next(error)
  }
};
