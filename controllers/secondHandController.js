const Product = require("../models/product");
const BidProduct = require("../models/bidproduct");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");

const MIN_BID_INCREMENT = 100;

//homepage for second hand
exports.getHome = (req, res, next) => {
  res.render("secondHand/secondHandHome", {
    pageTitle: "Second Hand",
    path: "/secondHand",
    activePage: "secondHand", // Added activePage
  });
};

//add product form for selling product
exports.getAddProduct = (req, res, next) => {
  res.render("secondHand/add-product", {
    pageTitle: "Add Product",
    path: "/secondHand/sell/add-product",
    activePage: "secondHand", // Added activePage
  });
};

//creating products for sell
exports.postAddProduct = (req, res) => {
  const { title, imageUrl, price, min_price, description, location, startDate, endDate } = req.body;
  
  const product = new Product({
    title,
    imageUrl,
    price: parseFloat(price),
    min_price: parseFloat(min_price),
    description,
    location,
    startDate,
    endDate,
    seller: req.user._id,
    saleType: 'auction'
  });

  product.save()
    .then(() => {
      res.redirect("/secondHand/buy");
    })
    .catch(err => {
      console.log(err);
      req.flash("error", "Error creating auction listing");
      res.redirect("/secondHand/sell/add-product");
    });
};

//all the products for buy page
exports.getProducts = (req, res, next) => {
  const searchQuery = req.query.search || "";
  let filter = {};

  // If a search term is provided, build a filter for title, description, or location.
  if (searchQuery) {
    filter = {
      $or: [
        { title: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
        { location: { $regex: searchQuery, $options: "i" } }
      ]
    };
  }

  Product.find(filter)
    .populate("seller", "fullName") // Fetch seller's full name
    .then((products) => {
      res.render("secondHand/buy", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
        user: req.user,
        searchQuery: searchQuery,  // Pass searchQuery to the view
        activePage: "secondHand",  // Added activePage
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

//every product auction page
// "/buy/:productId"
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    // .populate("bids") // Populate bid products
    .populate("seller", "fullName")
    .populate({
      path: "bids",
      populate: { path: "bidder", select: "fullName" }, // Fetch bidder details
    })
    .then((product) => {
      // Calculate maximum bid from existing bids
      const maxBid = product.bids
        .filter((bid) => bid.bidAmount !== null)
        .reduce((max, bid) => Math.max(max, bid.bidAmount), product.min_price);
      res.render("secondHand/auction", {
        product: product,
        user: req.user,
        pageTitle: "Auction",
        maxBid: maxBid,
        path: "/product",
        activePage: "secondHand",  // Added activePage
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

//add product bid page
// "/buy/:productId/add-bid-product"
exports.getAddBidProduct = (req, res, next) => {
  const prodId = req.params.productId;
  res.render("secondHand/addBidProduct", {
    pageTitle: "Add Bid Product",
    path: "/add-bid-product",
    productId: prodId,
    activePage: "secondHand",  // Added activePage
    messages: req.flash()
  });
};

//save new bidproduct in db
exports.postAddBidProduct = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: Please log in" });
  }

  const prodId = req.params.productId;
  const { title, imageUrl, description, location, bidAmount } = req.body;

  // Check for existing bid by this user
  const existingBid = await BidProduct.findOne({
    bidder: req.user._id,
    auction: prodId
  });

  if (existingBid) {
    req.flash(
      'error',
      `You already have an active bid. Delete your previous bid (₹${existingBid.bidAmount || "product bid"}) to place a new one.`
    );
    return res.redirect(`/secondHand/buy/${prodId}`);
  }

  // Get the product with current bids
  const product = await Product.findById(prodId)
  .populate({
    path: "bids",
    match: { bidAmount: { $ne: null } }
  });

// Calculate current max bid
const currentMaxBid = product.bids.reduce(
  (max, bid) => Math.max(max, bid.bidAmount),
  product.min_price // Start with initial price
);

// Validate bid amount
if (bidAmount && bidAmount < currentMaxBid + MIN_BID_INCREMENT) {
  req.flash(
    'error', 
    `Bid must be at least ₹${currentMaxBid + MIN_BID_INCREMENT} (Current max: ₹${currentMaxBid})`
  );
  return res.redirect(`/secondHand/buy/${prodId}`);
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
        User.findByIdAndUpdate(
          req.user._id,
          { $addToSet: { cart: prodId } } // Adds product to bidder's cart
        ),
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
    
    // Remove bid reference from Product
    await Product.findByIdAndUpdate(
      bid.auction,
      { $pull: { bids: bidId } }
    );
    
    // Add session save before redirect
    req.session.save(err => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).send("Internal Server Error");
      }
      req.flash('success', 'Bid deleted successfully');
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
    activePage: "secondHand"
  });
};

exports.getDirectAddProduct = (req, res) => {
  res.render("secondHand/direct-add-product", {
    pageTitle: "Direct Selling",
    activePage: "secondHand"
  });
};

exports.postDirectAddProduct = async (req, res) => {
  const { title, imageUrl, price, description, location, quantity } = req.body;

  try {
    const product = new Product({
      title,
      imageUrl,
      price: parseFloat(price),
      min_price: parseFloat(price), // Set to same as price
      description,
      location,
      quantity: parseInt(quantity),
      seller: req.user._id,
      saleType: 'direct',
      startDate: new Date(), // Add current date
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    await product.save();
    req.flash('success', 'Direct listing created successfully!');
    res.redirect("/secondHand/buy");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error creating direct listing");
    res.redirect("/secondHand/sell/direct-add-product");
  }
};

exports.addToCart = (req, res, next) => {
  const userId = req.user._id;
  const productId = req.params.productId;
  const quantityToAdd = parseInt(req.body.quantity) || 1;

  Product.findById(productId)
    .then(product => {
      if (!product) {
        req.flash("error", "Product not found.");
        return res.redirect("/secondHand");
      }
      return Cart.findOne({ user: userId });
    })
    .then(cart => {
      const newItem = {
        productType: 'SecondHand', // Changed to SecondHand
        productModel: 'Product',   // Changed to Product
        product: productId,
        quantity: quantityToAdd
      };

      if (!cart) {
        return new Cart({
          user: userId,
          items: [newItem]
        }).save();
      }

      const existingIndex = cart.items.findIndex(item => 
        item.product.equals(productId) && 
        item.productType === 'SecondHand' // Changed to SecondHand
      );

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += quantityToAdd;
      } else {
        cart.items.push(newItem);
      }

      return cart.save();
    })
    .then(() => res.redirect("/cart"))
    .catch(err => {
      console.error(err);
      req.flash("error", "Failed to add to cart.");
      res.redirect(req.get("Referrer") || "/");
    });
};


