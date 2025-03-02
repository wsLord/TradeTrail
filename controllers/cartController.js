// controllers/cartController.js
const Cart = require("../models/cartModel");

exports.getCart = (req, res, next) => {
  const userId = req.user._id;
  Cart.findOne({ user: userId })
    .populate("items.product")  // Populates product details for display
    .then(cart => {
      if (!cart) {
        // If no cart exists, send an empty cart object
        return res.render("cart", {
          pageTitle: "Your Cart",
          cart: { items: [] }
        });
      }
      res.render("cart", {
        pageTitle: "Your Cart",
        cart: cart
      });
      
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: "Error fetching cart" });
    });
};
