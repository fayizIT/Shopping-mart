const Cart = require("../models/cartModel");
const { ObjectId } = require("mongodb");

module.exports={

  getCartValue: (userId) => {

        return new Promise(async (resolve, reject) => {
            try {
                const productDetails = await Cart.findOne({ user_id: userId }).lean();
                console.log(productDetails, 'productDetails');
    
                // Calculate the new subtotal for all products in the cart
                const subtotal = productDetails.products.reduce((acc, product) => {
                    return acc + product.total;
                }, 0);
    
                console.log(subtotal, 'subtotal');
    
                if (subtotal) {
                    resolve(subtotal)
                } else {
                    resolve(false);
                }
            } catch (error) {
                reject(error)
            }
           
        })
    },
}
