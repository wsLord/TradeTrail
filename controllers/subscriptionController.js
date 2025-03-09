const Ott = require("../models/ott");
const BidProducts = require("../models/BidProducts");
const subscriptionCart = require("../models/subscriptionCart");
const User = require("../models/userModel");

exports.getHome = (req, res, next) => {
    res.render("subscriptionSwapping/subscriptionHome", {
        pageTitle: "Subscription Swapping",
        path: "/subscription",
        activePage: "subscription" // added for navbar active highlighting
    });
};

exports.addToCart = (req, res, next) => {
    const userId = req.user._id; // Provided by protectRoute middleware
    const productId = req.params.productId;
    const quantityToAdd = parseInt(req.body.quantity) || 1;
    Ott.findById(productId)
        .then(product => {
            if (!product) {
                req.flash("error", "Product not found.");
                return res.redirect("/subscription");
            }
            console.log(product);
            return subscriptionCart.findOne({ user: userId }).then(subscriptionCar => {
                return { product, subscriptionCar };
            });
        })
        .then(({ product, subscriptionCar }) => {
            // Check if adding quantity will exceed available stock
            if (!subscriptionCar) {
                if (quantityToAdd > product.quantity) {
                    req.flash("error", "Cannot add more items than available.");
                    return res.redirect(req.get("Referrer") || "/");
                }
                const newSubscriptionCart = new subscriptionCart({
                    user: userId,
                    items: [{ product: productId, quantity: quantityToAdd }]
                });
                return newSubscriptionCart.save();
            } else {
                if (!Array.isArray(subscriptionCar.items)) {
                    subscriptionCar.items = []; // Ensure it's an array
                }
                const itemIndex = subscriptionCar.items.findIndex(
                    (item) => item.product.toString() === productId
                );
                if (itemIndex >= 0) {
                    const currentQuantity = subscriptionCar.items[itemIndex].quantity;
                    if (currentQuantity + quantityToAdd > product.quantity) {
                        req.flash("error", "Cannot add more items than available.");
                        return res.redirect(req.get("Referrer") || "/");
                    }
                    subscriptionCar.items[itemIndex].quantity += quantityToAdd;
                } else {
                    if (quantityToAdd > product.quantity) {
                        req.flash("error", "Cannot add more items than available.");
                        return res.redirect(req.get("Referrer") || "/");
                    }
                    subscriptionCar.items.push({ product: productId, quantity: quantityToAdd });
                }
                return subscriptionCar.save();
            }
        })
        .then(savedCart => {
            // If flash message was set and redirection already happened, do nothing.
            if (res.headersSent) return;
            res.redirect("/subscription/add-to-cart");
        })
        .catch(err => {
            console.error(err);
            req.flash("error", "Failed to add to subscriptionCart due to a server error.");
            res.redirect(req.get("Referrer") || "/");
        });
};

exports.getAddProduct = (req, res, next) => {
    res.render("subscriptionSwapping/add-product", {
        pageTitle: "Add Product",
        path: "/subscription/sell",
        activePage: "subscription" // added for navbar active highlighting
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.platform_name;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const min_price = req.body.min_price;
    const description = req.body.description;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;

    // Modified: include seller field (required by Ott schema)
    const product = new Ott({
        platform_name: title,
        imageUrl: imageUrl,
        price: price,
        min_price: min_price,
        description: description,
        startDate: startDate,
        endDate: endDate,
        seller: req.user._id
    });
    
    product
        .save()
        .then((result) => {
            console.log("Created Product");
            res.redirect("/subscription/buy");
        })
        .catch((err) => {
            console.error(err);
            req.flash("error", "Failed to add product.");
            res.redirect("/subscription/sell");
        });
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
        .populate("seller", "fullName")  // Add this line to populate seller details
        .then((products) => {
            res.render("subscriptionSwapping/buy", {
                prods: products,
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
                .reduce((max, bid) => Math.max(max, bid.bidAmount), 0);
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

exports.updateCart = (req, res, next) => {
    const productId = req.params.productId;
    let newQuantity = parseInt(req.body.quantity);
    const userId = req.user._id;

    // Ensure quantity is at least 1
    if (newQuantity < 1) {
        newQuantity = 1;
    }

    Ott.findById(productId)
        .then((product) => {
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
            return subscriptionCart.findOne({ user: userId }).then((cart) => {
                if (!cart) {
                    cart = new subscriptionCart({ user: userId, items: [] });
                }
                if (!Array.isArray(cart.items)) {
                    cart.items = [];
                }
                const itemIndex = cart.items.findIndex(
                    (item) => item.product.toString() === productId
                );
                if (itemIndex > -1) {
                    cart.items[itemIndex].quantity = newQuantity;
                } else {
                    cart.items.push({ product: productId, quantity: newQuantity });
                }
                return cart.save();
            });
        })
        .then(() => {
            res.redirect("/subscription");
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ message: "Error updating subscription cart" });
        });
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

exports.postAddBidProduct = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized: Please log in" });
    }

    console.log(req.user);

    const prodId = req.params.productId;
    const { title, imageUrl, description, location, bidAmount } = req.body;

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
