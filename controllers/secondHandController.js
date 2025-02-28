const Product = require("../models/product");
const BidProduct = require("../models/bidproduct");
const User = require("../models/userModel");

//homepage for second hand
exports.getHome = (req, res, next) => {
  res.render("secondHand/secondHandHome", {
    pageTitle: "Second Hand",
    path: "/secondHand",
  });
};

//add product form for selling product
exports.getAddProduct = (req, res, next) => {
  res.render("secondHand/add-product", {
    pageTitle: "Add Product",
    path: "/secondHand/sell",
  });
};

//creating products for sell
exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const location = req.body.location;
  const startDate = req.body.startDate;
  const endDate = req.body.endDate;
  const product = new Product({
    title: title,
    imageUrl: imageUrl,
    price: price,
    description: description,
    location: location,
    startDate: startDate,
    endDate: endDate,
    seller: req.user._id,
  });
  product
    .save()
    .then((result) => {
      // console.log("Created Product");
      //want to show products in second hand buy
      res.redirect("/secondHand/buy");
    })
    .catch((err) => {
      console.log(err);
    });
};

//all the products for buy page
exports.getProducts = (req, res, next) => {
  Product.find()
    .populate("seller", "fullName") // ✅ Fetch seller's full name
    .then((products) => {
      res.render("secondHand/buy", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
        user: req.user,
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
      // console.log("Authenticated User:", req.user);
      //display max-bid
      const maxBid = product.bids
        .filter((bid) => bid.bidAmount !== null)
        .reduce((max, bid) => Math.max(max, bid.bidAmount), 0);
      res.render("secondHand/auction", {
        product: product,
        user: req.user,
        pageTitle: "Auction",
        maxBid: maxBid,
        path: "/product",
        // bidProducts: product.bids, // Pass bid products to EJS
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
  });
};

//save new bidproduct in db
// exports.postAddBidProduct = async (req, res, next) => {
//   try {
//     // console.log("✅ User in postAddBidProduct:", req.user);
//     if (!req.user) {
//       return res.status(401).json({ message: "Unauthorized: Please log in" });
//     }

//     const prodId = req.params.productId;
//     const { title, imageUrl, description, location, bidAmount } = req.body;

//     if (!bidAmount && !title) {
//       return res
//         .status(400)
//         .send("Error: Provide either a bid amount or a product.");
//     }

//     const bidProduct = new BidProduct({
//       title: title || null,
//       imageUrl: imageUrl || null,
//       description: description || null,
//       location: location || null,
//       bidAmount: bidAmount ? Number(bidAmount) : null,
//       bidder: req.user._id, // ✅ Safe now
//       auction: prodId,
//     });

//     const savedBidProduct = await bidProduct.save();

//     await Product.findByIdAndUpdate(
//       prodId,
//       { $push: { bids: savedBidProduct._id } },
//       { new: true }
//     );

//     res.redirect(`/secondHand/buy/${prodId}`);
//   } catch (err) {
//     console.error("Error saving bid:", err);
//     res.status(500).send("Internal Server Error");
//   }
// };

exports.postAddBidProduct = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: Please log in" });
  }

  const prodId = req.params.productId;
  const { title, imageUrl, description, location, bidAmount } = req.body;

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
          { $addToSet: { cart: prodId } } // ✅ Adds product to bidder's cart
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