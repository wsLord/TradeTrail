const Product = require("../models/product");
const BidProduct = require("../models/bidproduct");

//homepage for second hand
exports.getHome = (req, res, next) => {
  res.render("secondHand/secondHandHome", {
    pageTitle: "Second Hand",
    path: "/secondHand",
  });
};

//add product form
exports.getAddProduct = (req, res, next) => {
  res.render("secondHand/add-product", {
    pageTitle: "Add Product",
    path: "/secondHand/sell",
  });
};

//creating products 
exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const location = req.body.location;
  const startDate=req.body.startDate;
  const endDate=req.body.endDate;
  const product = new Product({
    title: title,
    imageUrl: imageUrl,
    price: price,
    description: description,
    location:location,
    startDate:startDate,
    endDate:endDate
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

//for buy page--all the products
exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('secondHand/buy', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products'
      });
    })
    .catch(err => {
      console.log(err);
    });
};

//every product auction page
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .populate("bids") // Populate bid products
    .then(product => {
      res.render("secondHand/auction", {
        product: product,
        pageTitle: "Auction",
        path: "/product",
        bidProducts: product.bids // Pass bid products to EJS
      });
    })
    .catch(err => {
      console.log(err);
    });
};


//add product bid page
exports.getAddBidProduct = (req, res, next) => {
  const prodId = req.params.productId;
  res.render("secondHand/addBidProduct", {
    pageTitle: "Add Bid Product",
    path: "/add-bid-product",
    productId: prodId
  });
};

//save new bidproduct in db
// exports.postAddBidProduct = (req, res, next) => {
//   const prodId = req.params.productId;
//   const { title,imageUrl, description,location } = req.body;

//   const bidProduct = new BidProduct({
//     title,
//     imageUrl,
//     description,
//     location,
//     auction: prodId
//   });

//   bidProduct
//   .save()
//   .then((savedBidProduct) => {
//     console.log("Successfully saved bid product:", savedBidProduct);
//     return Product.findByIdAndUpdate(prodId, { 
//       $push: { bids: savedBidProduct._id } 
//     }, { new: true });
//   })
//   .then(updatedProduct => {
//     console.log("Updated product with bid:", updatedProduct);
//     res.redirect(`/secondHand/buy/${prodId}`);
//   })
//   .catch(err => {
//     console.log("Error saving bid product:", err);
//   });
// };
exports.postAddBidProduct = (req, res, next) => {
  const prodId = req.params.productId;
  const { title, imageUrl, description, location, bidAmount, bidder } = req.body;

  if (!bidAmount && !title) {
    return res.status(400).send("Error: Provide either a bid amount or a product.");
  }

  const bidProduct = new BidProduct({
    title: title || null,
    imageUrl: imageUrl || null,
    description: description || null,
    location: location || null,
    bidAmount: bidAmount ? Number(bidAmount) : null,
    // bidder,
    auction: prodId
  });

  bidProduct
    .save()
    .then((savedBidProduct) => {
      return Product.findByIdAndUpdate(prodId, { 
        $push: { bids: savedBidProduct._id } 
      }, { new: true });
    })
    .then(updatedProduct => {
      res.redirect(`/secondHand/buy/${prodId}`);
    })
    .catch(err => {
      console.log("Error saving bid:", err);
      res.status(500).send("Internal Server Error");
    });
};
