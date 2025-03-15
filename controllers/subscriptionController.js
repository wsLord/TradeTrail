const Ott = require("../models/ott");
const BidProducts = require("../models/BidProducts");
const Cart = require("../models/cartModel"); 
const User = require("../models/userModel");

const MIN_BID_INCREMENT = 100;

exports.getHome = (req, res, next) => {
    res.render("subscriptionSwapping/subscriptionHome", {
        pageTitle: "Subscription Swapping",
        path: "/subscription",
        activePage: "subscription" // added for navbar active highlighting
    });
};

exports.addToCart = async (req, res) => {
  try {
      const userId = req.user._id;
      const productId = req.params.productId;
      
      // Force quantity to 1 for subscriptions
      const quantityToAdd = 1; // Override any incoming quantity

      const product = await Ott.findById(productId);
      if (!product) {
          req.flash("error", "Product not found.");
          return res.redirect("/subscription");
      }

      let cart = await Cart.findOne({ user: userId });

      // Check if subscription already exists in cart
      if (cart) {
          const existingSubscription = cart.items.find(item => 
              item.product.equals(productId) && 
              item.productType === 'Subscription'
          );

          if (existingSubscription) {
              req.flash("error", "You can only have one subscription of each type in your cart");
              return res.redirect("/subscription/buy");
          }
      }

      const newItem = {
          productType: 'Subscription',
          productModel: 'Ott',
          product: productId,
          quantity: 1 // Force quantity to 1
      };

      if (!cart) {
          cart = await Cart.create({
              user: userId,
              items: [newItem]
          });
      } else {
          cart.items.push(newItem);
          await cart.save();
      }

      res.redirect("/cart");
  } catch (err) {
      console.error(err);
      req.flash("error", "Failed to add to cart.");
      res.redirect(req.get("Referrer") || "/");
  }
};

// 3. Modify existing postAddProduct controller
exports.postAddProduct = (req, res) => {
    req.session.tempProduct = {
      platform_name: req.body.platform_name,
      imageUrl: req.body.imageUrl,
      price: req.body.price,
      min_price: req.body.min_price,
      description: req.body.description,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      seller: req.user._id,
      saleType: 'auction'
    };
    
    res.redirect("/subscription/verify-credentials");
  };

exports.getProducts = (req, res, next) => {
    const searchQuery = req.query.search || "";
    let filter = {};

    if (searchQuery) {
        filter = {
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { platform_name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { location: { $regex: searchQuery, $options: 'i' } }
            ]
        };
    }

    Ott.find(filter)
        .populate("seller", "fullName _id")  // Add this line to populate seller details
        .then((products) => {
            res.render("subscriptionSwapping/buy", {
                prods: products,
                user: req.user,
                pageTitle: "All Products",
                path: "/products",
                searchQuery: searchQuery,
                activePage: "subscription"
                
            });
        })
        .catch((err) => {
            console.log(err);
        });
};


exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Ott.findById(prodId)
        .populate("seller", "fullName")
        .populate({
            path: "bids",
            populate: { path: "bidder", select: "fullName" },
        })
        .then((product) => {
            
            if (!product) {
                req.flash("error", "Product not found.");
                return res.redirect("/subscription/buy");
            }
            // Calculate max bid if available
            const maxBid = product.bids
                .filter((bid) => bid.bidAmount !== null)
                .reduce((max, bid) => Math.max(max, bid.bidAmount), product.min_price);
            res.render("subscriptionSwapping/auction", {
                product: product,
                user: req.user,
                pageTitle: "Auction",
                maxBid: maxBid,
                path: "/product",
                activePage: "subscription" // added for navbar active highlighting
            });
        })
        .catch((err) => {
            console.log(err);
            req.flash("error", "Error retrieving product.");
            res.redirect("/subscription/buy");
        });
};

exports.updateCart = async (req, res) => {
    try {
        const productId = req.params.productId;
        const newQuantity = parseInt(req.body.quantity);
        const userId = req.user._id;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) return res.redirect("/cart");

        const item = cart.items.find(item => 
            item.product.toString() === productId &&
            item.productType === 'Subscription'
        );

        if (item) {
            item.quantity = Math.max(newQuantity, 1);
            await cart.save();
        }

        res.redirect("/cart");
    } catch (err) {
        console.error(err);
        res.redirect("/cart");
    }
};

exports.getAddBidProduct = (req, res, next) => {
    const prodId = req.params.productId;
    res.render("subscriptionSwapping/addBidProduct", {
        pageTitle: "Add Bid Product",
        path: "/add-bid-product",
        productId: prodId,
        activePage: "subscription" // added for navbar active highlighting
    });
};

exports.postAddBidProduct = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized: Please log in" });
    }
    const prodId = req.params.productId;
    const { title, imageUrl, description, location, bidAmount } = req.body;

    // NEW: Check for existing bid
  const existingBid = await BidProducts.findOne({
    bidder: req.user._id,
    auction: prodId
  });

  if (existingBid) {
    req.flash(
      'error',
      `You already have an active bid. Delete your previous bid (₹${existingBid.bidAmount || "product bid"}) to place a new one.`
    );
    return res.redirect(`/subscription/buy/${prodId}`);
  }


    // Get the product with current bids
      const product = await Ott.findById(prodId)
      .populate({
        path: "bids",
        match: { bidAmount: { $ne: null } }
      });
    
    // Calculate current max bid
    const currentMaxBid = product.bids.reduce(
      (max, bid) => Math.max(max, bid.bidAmount),
      product.price // Start with initial price
    );
    
    // Validate bid amount
    if (bidAmount && bidAmount < currentMaxBid + MIN_BID_INCREMENT) {
      req.flash(
        'error', 
        `Bid must be at least ₹${currentMaxBid + MIN_BID_INCREMENT} (Current max: ₹${currentMaxBid})`
      );
      return res.redirect(`/subscription/buy/${prodId}`);
    }

    if (!bidAmount && !title) {
        return res
            .status(400)
            .send("Error: Provide either a bid amount or a product.");
    }

    const bidProduct = new BidProducts({
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
                Ott.findByIdAndUpdate(
                    prodId, { $push: { bids: savedBidProduct._id } }, { new: true }
                ),
                User.findByIdAndUpdate(
                    req.user._id, { $addToSet: { cart: prodId } }
                ),
            ]);
        })
        .then(() => {
            res.redirect(`/subscription/buy/${prodId}`);
        })
        .catch((err) => {
            console.error("Error saving bid:", err);
            res.status(500).send("Internal Server Error");
        });
};

// Add this new method to subscriptionController.js
exports.deleteBid = async (req, res, next) => {
    try {
      const bidId = req.params.bidId;
      const bid = await BidProducts.findByIdAndDelete(bidId);
      
      // Remove bid reference from Ott product
      await Ott.findByIdAndUpdate(
        bid.auction,
        { $pull: { bids: bidId } }
      );
      
      req.flash('success', 'Bid deleted successfully');
      res.redirect(`/subscription/buy/${bid.auction}`);
    } catch (err) {
      console.error("Error deleting bid:", err);
      res.status(500).send("Internal Server Error");
    }
  };

// Render credential verification page
exports.getVerifyCredentials = (req, res) => {
    res.render("subscriptionSwapping/verify-credentials", {
        pageTitle: "Verify Credentials",
        path: "/subscription/verify-credentials",
        activePage: "subscription",
        productId: req.query.productId,
        action: req.query.productId ? 'update' : 'verify'
    });
};

exports.postVerifyCredentials = async (req, res) => {
    const { action, email, password } = req.body;
    const productData = req.session.tempProduct || await Ott.findById(req.body.productId);

    try {
        if (action === 'verify') {
            // Add actual verification logic here
            if (!email || !password) {
                req.flash('error', 'Please fill all credentials');
                return res.redirect('back');
            }
            
        const product = req.session.tempProduct ? 
            new Ott({ ...productData, credentialsVerified: true, verificationPending: false }) :
            await Ott.findByIdAndUpdate(
                productData._id, 
                { credentialsVerified: true, verificationPending: false },
                { new: true }
        );
        await product.save();
            delete req.session.tempProduct;
            req.flash('success', 'Credentials verified successfully!');
        } 
        else if (action === 'skip') {
            if (req.session.tempProduct) {
                const product = new Ott({ 
                    ...productData, 
                    verificationPending: true 
                });
                await product.save();
                delete req.session.tempProduct;
            }
            req.flash('info', 'You can verify credentials later');
        }

        res.redirect("/subscription/buy");
    } catch (err) {
        console.error(err);
        req.flash("error", "Error processing request");
        res.redirect("/subscription/sell");
    }
};

exports.getPostType = (req, res) => {
    res.render("subscriptionSwapping/post-type", {
      pageTitle: "Choose Listing Type",
      activePage: "subscription"
    });
  };
  
  exports.getDirectAddProduct = (req, res) => {
    res.render("subscriptionSwapping/direct-add-product", {
      pageTitle: "Direct Selling",
      activePage: "subscription"
    });
  };
  
  exports.postDirectAddProduct = async (req, res) => {
    req.session.tempDirectProduct = {
      platform_name: req.body.platform_name,
      imageUrl: req.body.imageUrl,
      price: parseFloat(req.body.price),
      min_price: parseFloat(req.body.price),
      description: req.body.description,
      quantity: 1,
      location: req.body.location,
      seller: req.user._id,
      saleType: 'direct',
      startDate: new Date(),
      endDate: new Date()
    };
    
    res.redirect("/subscription/direct-verify");
  };

  exports.getDirectVerifyCredentials = (req, res) => {
    res.render("subscriptionSwapping/direct-verify-credentials", {
      pageTitle: "Verify Direct Listing",
      path: "/subscription/direct-verify",
      activePage: "subscription"
    });
  };
  
// Modify the postDirectVerifyCredentials controller
exports.postDirectVerifyCredentials = async (req, res) => {
    const { action, email, password } = req.body;
    const productData = req.session.tempDirectProduct;
  
    try {
      if (!productData) {
        req.flash('error', 'Session expired. Please start over.');
        return res.redirect('/subscription/sell/direct-add-product');
      }
  
      if (action === 'verify') {
        if (!email || !password) {
          req.flash('error', 'Please fill all credentials');
          return res.redirect('back');
        }
        // Add actual verification logic here
        productData.credentialsVerified = true;
        productData.verificationPending = false;
      } else {
        productData.credentialsVerified = false;
        productData.verificationPending = true;
      }
  
      const product = new Ott(productData);
      await product.save();
      delete req.session.tempDirectProduct;
      
      req.flash('success', 'Direct listing created successfully!');
      res.redirect("/subscription/buy");
    } catch (err) {
      console.error(err);
      req.flash("error", "Error creating direct listing");
      res.redirect("/subscription/sell/direct-add-product");
    }
  };

  exports.getAddProduct = (req, res) => {
    res.render("subscriptionSwapping/add-product", {
        pageTitle: "Add Subscription Product",
        path: "/subscription/sell/add-product",
        activePage: "subscription"
    });
};