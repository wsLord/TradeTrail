// controllers/cartController.js
const Cart = require("../models/cartModel");

exports.getCart = (req, res, next) => {
  const userId = req.user._id;
  Cart.findOne({ user: userId })
    .populate("items.product")  // Populates product details for display
    .then(cart => {
      if (!cart) {
        // If no cart exists, send an empty cart object
        return res.render("rentals/rentalCart", {
          pageTitle: "Your Cart",
          cart: { items: [] },
          activePage: "cart" // Added activePage for navbar highlighting
        });
      }

      cart.items = cart.items.filter(item => item.product);

      res.render("rentals/rentalCart", {
        pageTitle: "Your Cart",
        cart: cart,
        activePage: "cart" // Added activePage for navbar highlighting
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: "Error fetching cart" });
    });
};

exports.deleteCartItem = (req, res, next) => {
  const prodId = req.params.id;
  const userId = req.user._id;

  Cart.findOne({ user: userId })
    .then(cart => {
      if (!cart) {
        // If no cart is found, simply redirect
        return res.redirect('/rental/cart');
      }
      // Remove the item from the cart
      cart.items = cart.items.filter(
        item => item.product.toString() !== prodId.toString()
      );
      return cart.save();
    })
    .then(result => {
      res.redirect('/rental/cart');
    })
    .catch(err => {
      console.error(err);
      res.redirect('/rental/cart');
    });
};
exports.getRentalCart = (req, res) => {
  res.render('rentals/rentalCart', {
      razorpayKeyId: rzp_test_EZ3YXbVoBjMVZW  // ✅ Pass key to EJS
  });
};

