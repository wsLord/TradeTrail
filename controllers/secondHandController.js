const Product = require("../models/product");
const BidProduct = require("../models/bidSecondHand");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");

const MIN_BID_INCREMENT = 100;

exports.getHome = (req, res, next) => {
  res.render("secondHand/secondHandHome", {
    pageTitle: "Second Hand",
    path: "/secondHand",
    activePage: "secondHand",
  });
};

//add product form for selling product
exports.getAddProduct = (req, res, next) => {
  res.render("secondHand/add-product", {
    pageTitle: "Add Product",
    path: "/secondHand/sell/add-product",
    activePage: "secondHand",
  });
};

exports.postAddProduct = (req, res, next) => {
  const { title, price, min_price, description, location, startDate, endDate } =
    req.body;

  const imageUrls = req.files.map((file) => file.path);

  const product = new Product({
    title,
    imageUrls,
    price: parseFloat(price),
    min_price: parseFloat(min_price),
    description,
    location,
    startDate,
    endDate,
    seller: req.user._id,
    saleType: "auction",
  });

  product
    .save()
    .then(() => {
      res.redirect("/secondHand/buy");
    })
    .catch((err) => {
      console.log(err);
      req.flash("error", "Error creating auction listing");
      res.redirect("/secondHand/sell/add-product");
    });
};

exports.getProducts = (req, res, next) => {
  const { search, minPrice, maxPrice, location, saleType } = req.query;
  const filter = {};

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  if (location) {
    filter.location = new RegExp(location, "i");
  }

  if (saleType) {
    filter.saleType = saleType;
  }

  Promise.all([
    Product.find(filter).populate("seller", "fullName"),
    Product.distinct("location"),
    Product.distinct("saleType"),
  ])
    .then(([products, locations, saleTypes]) => {
      res.render("secondHand/buy", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
        user: req.user,
        searchQuery: search || "",
        minPrice: minPrice || "",
        maxPrice: maxPrice || "",
        location: location || "",
        saleType: saleType || "",
        locations: locations.filter((l) => l),
        saleTypes: saleTypes.filter((st) => st),
        activePage: "secondHand",
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error", "Error loading products");
      res.redirect("/secondHand/buy");
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .populate("seller", "fullName")
    .populate("winner", "fullName")
    .populate({
      path: "bids",
      populate: { path: "bidder", select: "fullName" },
    })
    .then((product) => {
      if (!product) {
        req.flash("error", "Product not found.");
        return res.redirect("/secondHand/buy");
      }

      const monetaryBids = product.bids.filter((bid) => bid.bidAmount !== null);
      const maxBid = monetaryBids.reduce(
        (max, bid) => Math.max(max, bid.bidAmount),
        product.min_price
      );

      res.render("secondHand/auction", {
        product: product,
        user: req.user,
        pageTitle: "Auction",
        maxBid: maxBid,
        monetaryBidsCount: monetaryBids.length,
        MIN_BID_INCREMENT: MIN_BID_INCREMENT,
        path: "/product",
        activePage: "secondHand",
        type: "buy",
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error", "Error retrieving product.");
      res.redirect("/secondHand/buy");
    });
};

exports.getAddBidProduct = (req, res, next) => {
  const prodId = req.params.productId;
  res.render("secondHand/addBidProduct", {
    pageTitle: "Add Bid Product",
    path: "/add-bid-product",
    productId: prodId,
    activePage: "secondHand",
    messages: req.flash(),
  });
};

exports.postAddBidProduct = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: Please log in" });
  }

  const prodId = req.params.productId;
  const { title, imageUrl, description, location, bidAmount, paymentId } =
    req.body;

  const existingBid = await BidProduct.findOne({
    bidder: req.user._id,
    auction: prodId,
  });

  if (existingBid) {
    req.flash(
      "error",
      `You already have an active bid. Delete your previous bid to place a new one.`
    );
    return res.redirect(`/secondHand/buy/${prodId}`);
  }

  const product = await Product.findById(prodId).populate({
    path: "bids",
    match: { bidAmount: { $ne: null } },
  });

  const monetaryBids = product.bids.filter((bid) => bid.bidAmount !== null);
  const currentMaxBid = monetaryBids.reduce(
    (max, bid) => Math.max(max, bid.bidAmount),
    product.min_price
  );
  const monetaryBidsCount = monetaryBids.length;

  if (bidAmount) {
    const minRequired =
      monetaryBidsCount === 0
        ? product.min_price
        : currentMaxBid + MIN_BID_INCREMENT;

    if (bidAmount < minRequired) {
      req.flash(
        "error",
        monetaryBidsCount === 0
          ? `First bid must be at least ₹${product.min_price}`
          : `Bid must be at least ₹${
              currentMaxBid + MIN_BID_INCREMENT
            } (Current max: ₹${currentMaxBid})`
      );
      return res.redirect(`/secondHand/buy/${prodId}`);
    }
  }

  if (!bidAmount && !title) {
    return res
      .status(400)
      .send("Error: Provide either a bid amount or a product.");
  }

  const bidProduct = new BidProduct({
    title: title || null,
    imageUrl: imageUrl || null,
    description: description || null,
    location: location || null,
    bidAmount: bidAmount ? Number(bidAmount) : null,
    paymentId,
    bidder: req.user._id,
    auction: prodId,
  });

  bidProduct
    .save()
    .then((savedBidProduct) => {
      return Promise.all([
        Product.findByIdAndUpdate(
          prodId,
          { $push: { bids: savedBidProduct._id } },
          { new: true }
        ),
        User.findByIdAndUpdate(req.user._id, { $addToSet: { cart: prodId } }),
      ]);
    })
    .then(() => {
      res.redirect(`/secondHand/buy/${prodId}`);
    })
    .catch((err) => {
      console.error("Error saving bid:", err);
      res.status(500).send("Internal Server Error");
    });
};

exports.deleteBid = async (req, res, next) => {
  try {
    const bidId = req.params.bidId;
    const bid = await BidProduct.findByIdAndDelete(bidId);

    await Product.findByIdAndUpdate(bid.auction, { $pull: { bids: bidId } });

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).send("Internal Server Error");
      }
      req.flash("success", "Bid deleted successfully");
      res.redirect(`/secondHand/buy/${bid.auction}`);
    });
  } catch (err) {
    console.error("Error deleting bid:", err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getPostType = (req, res) => {
  res.render("secondHand/post-type", {
    pageTitle: "Choose Listing Type",
    activePage: "secondHand",
  });
};

exports.getDirectAddProduct = (req, res) => {
  res.render("secondHand/direct-add-product", {
    pageTitle: "Direct Selling",
    activePage: "secondHand",
  });
};

exports.postDirectAddProduct = async (req, res) => {
  const { title, price, description, location, quantity } = req.body;
  const imageUrls = req.files.map((file) => file.path);

  try {
    const product = new Product({
      title,
      imageUrls,
      price: parseFloat(price),
      min_price: parseFloat(price),
      description,
      location,
      quantity: parseInt(quantity),
      seller: req.user._id,
      saleType: "direct",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await product.save();
    req.flash("success", "Direct listing created successfully!");
    res.redirect("/secondHand/buy");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error creating direct listing");
    res.redirect("/secondHand/sell/direct-add-product");
  }
};

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.productId;

    const quantityToAdd = parseInt(req.body.quantity) || 1;

    const product = await Product.findById(productId);
    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("/secondHand");
    }

    const cart = await Cart.findOne({ user: userId });
    let existingQuantity = 0;

    if (cart) {
      const existingItem = cart.items.find(
        (item) =>
          item.product.toString() === productId &&
          item.productType === "SecondHand"
      );
      existingQuantity = existingItem ? existingItem.quantity : 0;
    }

    const totalRequested = existingQuantity + quantityToAdd;
    if (totalRequested > product.quantity) {
      req.flash(
        "error",

        `Cannot add more than the quantity available.`
      );
      return res.redirect(req.get("Referrer") || "/secondHand");
    }

    if (!cart) {
      const newCart = new Cart({
        user: userId,
        items: [
          {
            productType: "SecondHand",
            productModel: "Product",
            product: productId,
            quantity: quantityToAdd,
          },
        ],
      });
      await newCart.save();
    } else {
      const itemIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === productId &&
          item.productType === "SecondHand"
      );

      if (itemIndex >= 0) {
        cart.items[itemIndex].quantity += quantityToAdd;
      } else {
        cart.items.push({
          productType: "SecondHand",
          productModel: "Product",
          product: productId,
          quantity: quantityToAdd,
        });
      }
      await cart.save();
    }

    res.redirect("/cart");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to add to cart.");
    res.redirect(req.get("Referrer") || "/");
  }
};
