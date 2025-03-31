const RentalProduct = require("../models/rentalProduct");
const RentalBooking = require("../models/rentalBooking");
const Cart = require("../models/cartModel");

async function clearExpiredRentals() {
  const currentDate = new Date();
  const expiredRentals = await RentalBooking.find({
    rentalEnd: { $lt: currentDate },
    status: "active",
  });

  for (const rental of expiredRentals) {
    await RentalProduct.findByIdAndUpdate(rental.product, {
      buyer: null,
      currentBooking: null,
    });

    await RentalBooking.findByIdAndUpdate(rental._id, {
      status: "completed",
    });
  }
}

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.productId;
    const { rentalStart, rentalEnd } = req.body;

    if (!rentalStart || !rentalEnd) {
      req.flash("error", "Please select rental dates");
      return res.redirect(`/rental/details/${productId}`);
    }

    const product = await RentalProduct.findById(productId);
    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("/rental/rent");
    }

    if (product.quantity < 1) {
      req.flash("error", "This product is currently out of stock");
      return res.redirect(`/rental/details/${productId}`);
    }

    const cart = await Cart.findOne({ user: userId });
    let existingQuantity = 0;

    if (cart) {
      const existingItem = cart.items.find(
        (item) =>
          item.product.toString() === productId && item.productType === "Rental"
      );
      existingQuantity = existingItem ? existingItem.quantity : 0;
    }

    const totalRequested = existingQuantity + 1;

    if (totalRequested > product.quantity) {
      req.flash(
        "error",

        `Cannot add more than the quantity available.`
      );
      return res.redirect(`/rental/details/${productId}`);
    }

    const startDate = new Date(rentalStart);
    const endDate = new Date(rentalEnd);
    const diffTime = Math.abs(endDate - startDate);

    let units;
    switch (product.rate) {
      case "hour":
        units = diffTime / (1000 * 60 * 60);
        break;
      case "day":
        units = diffTime / (1000 * 60 * 60 * 24);
        break;
      case "week":
        units = diffTime / (1000 * 60 * 60 * 24 * 7);
        break;
      case "month":
        units = diffTime / (1000 * 60 * 60 * 24 * 30);
        break;
    }
    const calculatedPrice = Math.ceil(units) * product.price;

    const updatedCart = cart || new Cart({ user: userId });

    const existingItemIndex = updatedCart.items.findIndex(
      (item) =>
        item.product.toString() === productId && item.productType === "Rental"
    );

    if (existingItemIndex > -1) {
      updatedCart.items[existingItemIndex].quantity += 1;
    } else {
      updatedCart.items.push({
        productType: "Rental",
        productModel: "RentalProduct",
        product: productId,
        quantity: 1,
        rentalStart: startDate,
        rentalEnd: endDate,
        calculatedPrice,
        securityDeposit: product.securityDeposit,
      });
    }

    await updatedCart.save();
    res.redirect("/cart");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to add to cart.");
    res.redirect("/rental/rent");
  }
};

exports.getHome = (req, res, next) => {
  res.render("rentals/rentalHome", {
    pageTitle: "Renting",
    path: "/rental",
    activePage: "rental",
  });
};

// Add Product Form (Post an item for rent)
exports.getAddProduct = (req, res, next) => {
  res.render("rentals/post-product", {
    pageTitle: "Post Product",
    path: "/rental/post",
    activePage: "rental",
  });
};

exports.postAddProduct = (req, res, next) => {
  const {
    title,
    price,
    description,
    location,
    rate,
    quantity,
    securityDeposit,
  } = req.body;

  if (!req.files || req.files.length === 0) {
    console.log("No files uploaded!");
    return res.status(400).send("At least one image is required.");
  }

  const imageUrls = req.files.map((file) => file.path); // Get Cloudinary image URLs
  if (
    !title ||
    !imageUrls ||
    !price ||
    !description ||
    !location ||
    !rate ||
    !quantity ||
    !securityDeposit
  ) {
    return res.status(400).send("All fields are required!");
  }

  const rentalProduct = new RentalProduct({
    title: title,
    imageUrls: imageUrls,
    price: price,
    description: description,
    location: location,
    rate: rate,
    quantity: quantity,
    securityDeposit: securityDeposit,
    seller: req.user._id,
  });

  rentalProduct
    .save()
    .then(() => {
      res.redirect("/rental/rent");
    })
    .catch((err) => {
      console.error("Error saving product:", err);
      res
        .status(500)
        .send("An error occurred while saving the rental product.");
    });
};

exports.getRentItems = async (req, res, next) => {
  try {
    const { search, minPrice, maxPrice, location, rate } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (location) query.location = location;

    if (rate) query.rate = rate;

    const locations = await RentalProduct.distinct("location");

    const products = await RentalProduct.find(query);

    res.render("rentals/rent-items", {
      products,
      searchQuery: search,
      minPrice,
      maxPrice,
      location,
      rate,
      locations,
      pageTitle: "Available Rentals",
      path: "/rental/rent",
      activePage: "rental",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.buyProduct = (req, res, next) => {
  const productId = req.params.productId;

  RentalProduct.findById(productId)
    .populate("seller", "fullName")
    .then((product) => {
      if (product) {
        if (product.quantity > 0) {
          product.quantity -= 1;
          return product.save();
        } else {
          res
            .status(400)
            .json({ success: false, message: "Product is out of stock" });
          return null;
        }
      } else {
        res.status(404).json({ success: false, message: "Product not found" });
      }
    })
    .then((updatedProduct) => {
      if (updatedProduct) {
        res.redirect("/rental/rent");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "An error occurred while processing the purchase",
      });
    });
};

exports.getProductDetails = (req, res, next) => {
  const productId = req.params.productId;
  let fetchedProduct;

  RentalProduct.findById(productId)
    .populate("seller", "fullName")
    .populate("orderIds")
    .then((product) => {
      if (!product) {
        return res.status(404).send("Product not found");
      }

      fetchedProduct = product;

      return RentalBooking.findOne({
        product: productId,
        status: "active",
      }).populate("user", "fullName");
    })
    .then((booking) => {
      if (booking) {
        fetchedProduct.currentBooking = booking;
      }
      res.render("rentals/product-details", {
        pageTitle: fetchedProduct.title,
        product: fetchedProduct,
        activePage: "rental",
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error fetching product details");
    });
};

exports.updateCart = (req, res, next) => {
  const productId = req.params.productId;
  let newQuantity = parseInt(req.body.quantity);
  const userId = req.user._id;

  if (newQuantity < 1) {
    newQuantity = 1;
  }

  RentalProduct.findById(productId)
    .then((product) => {
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (newQuantity > product.quantity) {
        newQuantity = product.quantity;
      }

      return Cart.findOne({ user: userId });
    })
    .then((cart) => {
      if (!cart) {
        return res.redirect("/rental/cart");
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity = newQuantity;
      }
      return cart.save();
    })
    .then(() => {
      res.redirect("/rental/cart");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Error updating cart" });
    });
};

exports.rentProduct = (req, res, next) => {
  const productId = req.params.productId;
  const userId = req.user._id;
  const rentalEnd = req.body.rentalEnd;

  const booking = new RentalBooking({
    product: productId,
    user: userId,
    rentalEnd: rentalEnd,
  });

  booking
    .save()
    .then(() => {
      res.redirect("/rental/cart");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error processing your rental.");
    });
};
