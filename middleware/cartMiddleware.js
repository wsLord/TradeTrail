const Cart = require("../models/cart");
const { v4: uuidv4 } = require("uuid");

const initializeCart = async (req, res, next) => {
  try {
    let cart;

    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        cart = new Cart({ user: req.user._id, items: [], total: 0 });
        await cart.save();
      }
    } else {
      const guestId = req.cookies.guestId || uuidv4();
      cart = await Cart.findOne({ guestId });

      if (!cart) {
        cart = new Cart({ guestId, items: [], total: 0 });
        await cart.save();
      }

      if (!req.cookies.guestId) {
        res.cookie("guestId", guestId, {
          maxAge: 604800000,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        });
      }
    }

    req.cart = cart;
    next();
  } catch (error) {
    console.error("Cart middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = initializeCart;
