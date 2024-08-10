const Wishlist = require('../Model/wishlistSchema')


async function wishlistCountMiddleware(req, res, next) {
    if (req.session.passport?.user?.id || req.session.userId) {
        let userId = req.session.passport?.user?.id || req.session.userId;
        try {
            const wishlist = await Wishlist.findOne({user: userId});
            
            if (wishlist && wishlist.products) {
                res.locals.wishlistCount = wishlist.products.length;
            } else {
                res.locals.wishlistCount = 0;
            }
        } catch (error) {
            console.error('Error fetching wishlist count:', error);
            res.locals.wishlistCount = 0;
        }
    } else {
        res.locals.wishlistCount = 0;
    }
    next();
}

module.exports = { wishlistCountMiddleware };

