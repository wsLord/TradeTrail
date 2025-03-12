const Cart = require("../models/cartModel"); 

exports.getCart = (req, res, next) => {
  const userId = req.user._id;
  Cart.findOne({ user: userId, type: 'secondHand' }) 
    .populate("items.product")
    .then(cart => {
      if (!cart) {
        return res.render("secondHand/secondHandCart", {
          pageTitle: "Your Second-Hand Cart",
          cart: { items: [] },
          activePage: "secondHandCart"
        });
      }
      cart.items = cart.items.filter(item => item.product);
      res.render("secondHand/secondHandCart", {
        pageTitle: "Your Second-Hand Cart",
        cart: cart,
        activePage: "secondHandCart"
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
  Cart.findOne({ user: userId, type: 'secondHand' })
    .then(cart => {
      if (!cart) return res.redirect('/secondHand/cart');
      cart.items = cart.items.filter(item => item.product.toString() !== prodId.toString());
      return cart.save();
    })
    .then(() => res.redirect('/secondHand/cart'))
    .catch(err => {
      console.error(err);
      res.redirect('/secondHand/cart');
    });
};

exports.updateCart = (req, res, next) => {
  const prodId = req.params.productId;
  const newQuantity = req.body.quantity;
  const userId = req.user._id;

  Cart.findOne({ user: userId, type: 'secondHand' })
    .then(cart => {
      if (!cart) return res.redirect('/secondHand/cart');
      const itemIndex = cart.items.findIndex(item => item.product.toString() === prodId.toString());
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity = newQuantity;
      }
      return cart.save();
    })
    .then(() => res.redirect('/secondHand/cart'))
    .catch(err => {
      console.error(err);
      res.redirect('/secondHand/cart');
    });
};
