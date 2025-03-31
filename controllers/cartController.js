const Cart = require("../models/cartModel");
const mongoose = require("mongoose");

// Get cart products
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.product")
      .lean();

    if (!cart) {
      return res.render("cart/unifiedCart", { cart: { items: [] } });
    }

    const populatedItems = await Promise.all(
      cart.items.map(async (item) => {
        try {
          const ProductModel = mongoose.model(item.productModel);
          const product = await ProductModel.findById(item.product).lean();

          const rentalStart = item.rentalStart
            ? new Date(item.rentalStart)
            : null;
          const rentalEnd = item.rentalEnd ? new Date(item.rentalEnd) : null;

          return {
            ...item,
            product,
            rentalStart,
            rentalEnd,
          };
        } catch (error) {
          console.error(`Error populating ${item.productModel}:`, error);
          return null;
        }
      })
    );

    cart.items = populatedItems.filter(
      (item) => item !== null && item.product !== null
    );

    res.render("cart/unifiedCart", {
      pageTitle: "Your Cart",
      cart: cart,
      activePage: "cart",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching cart");
  }
};

exports.deleteCartItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.redirect("/cart");

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId
    );
    await cart.save();
    res.redirect("/cart");
  } catch (err) {
    console.error(err);
    res.redirect("/cart");
  }
};

exports.updateCart = async (req, res) => {
  try {
    const newQuantity = parseInt(req.body.quantity);
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) return res.redirect("/cart");

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.redirect("/cart");

    if (item.productType === "Subscription") {
      req.flash("error", "Subscription quantities cannot be modified");
      return res.redirect("/cart");
    }

    const ProductModel = mongoose.model(item.productModel);
    const product = await ProductModel.findById(item.product);

    if (newQuantity > product.quantity) {
      req.flash("error", "Quantity exceeds available stock");
      return res.redirect("/cart");
    }

    item.quantity = newQuantity;
    await cart.save();
    res.redirect("/cart");
  } catch (err) {
    console.error(err);
    res.redirect("/cart");
  }
};
