const RentalProduct = require('../models/rentalProduct');
const RentalBooking = require("../models/rentalBooking");
const Cart = require("../models/cartModel");

// Add-to-Cart Controller Method
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.productId;
    const quantityToAdd = parseInt(req.body.quantity) || 1;

    const product = await RentalProduct.findById(productId);
    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect(req.get("Referrer") || "/");
    }

    // Check available stock
    const cart = await Cart.findOne({ user: userId });
    let existingQuantity = 0;

    if (cart) {
      const existingItem = cart.items.find(
        (item) =>
          item.product.toString() === productId &&
          item.productType === "Rental"
      );
      existingQuantity = existingItem ? existingItem.quantity : 0;
    }

    const totalRequested = existingQuantity + quantityToAdd;
    if (totalRequested > product.quantity) {
      req.flash(
        "error",
        // `Cannot add to cart. Only ${product.quantity - existingQuantity} item(s) available.`
        `Cannot add more than the quantity available.`
      );
      return res.redirect(req.get("Referrer") || "/rental/rent");
    }

    // Add/Update cart
    if (!cart) {
      const newCart = new Cart({
        user: userId,
        items: [{
          productType: "Rental",
          productModel: "RentalProduct",
          product: productId,
          quantity: quantityToAdd,
        }],
      });
      await newCart.save();
    } else {
      const itemIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === productId &&
          item.productType === "Rental"
      );

      if (itemIndex >= 0) {
        cart.items[itemIndex].quantity += quantityToAdd;
      } else {
        cart.items.push({
          productType: "Rental",
          productModel: "RentalProduct",
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

// Homepage for Renting
exports.getHome = (req, res, next) => {
  res.render("rentals/rentalHome", {
    pageTitle: "Renting",
    path: "/rental",
    activePage: "rental"
  });
};

// Add Product Form (Post an item for rent)
exports.getAddProduct = (req, res, next) => {
  res.render("rentals/post-product", {
    pageTitle: "Post Product",
    path: "/rental/post",
    activePage: "rental"
  });
};

// Saving rental item in the database (Including Quantity)
exports.postAddProduct = (req, res, next) => {
  const { title, imageUrl, price, description, location, rate, quantity } = req.body;

  // Validate if all required fields are filled
  if (!title || !imageUrl || !price || !description || !location || !rate || !quantity) {
    return res.status(400).send('All fields are required!');
  }

  const rentalProduct = new RentalProduct({
    title: title,
    imageUrl: imageUrl,
    price: price,
    description: description,
    location: location,
    rate: rate,  // Save rate directly as per the form
    quantity: quantity,  // Save quantity directly
  });

  rentalProduct
    .save()
    .then((result) => {
      console.log("Rental Product Posted!");
      res.redirect("/rental/rent");  // Redirect to rentals page after posting
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("An error occurred while saving the rental product.");
    });
};

// Get all rental items (with search)
exports.getRentItems = (req, res, next) => {
  const searchQuery = req.query.search || '';
  const query = {};

  if (searchQuery) {
      query.$or = [
          { title: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { location: { $regex: searchQuery, $options: 'i' } }
      ];
  }

  RentalProduct.find(query)
      .then((products) => {
          res.render("rentals/rent-items", {
              pageTitle: "Available Rentals",
              path: "/rental/rent",
              products: products,
              searchQuery: searchQuery,
              activePage: "rental"
          });
      })
      .catch((err) => {
          console.log(err);
          res.status(500).send("An error occurred while fetching rental items.");
      });
};

// Controller method to handle the buying action and decrementing quantity
exports.buyProduct = (req, res, next) => {
  const productId = req.params.productId; // Extract product ID from the URL

  // Find the rental product by its ID in the database
  RentalProduct.findById(productId)
    .then((product) => {
      if (product) {
        // If the product has sufficient stock, decrement the quantity
        if (product.quantity > 0) {
          product.quantity -= 1;  // Decrement the quantity by 1
          return product.save();   // Save the updated product data to the DB
        } else {
          res.status(400).json({ success: false, message: 'Product is out of stock' });
          return null;
        }
      } else {
        res.status(404).json({ success: false, message: 'Product not found' });
      }
    })
    .then((updatedProduct) => {
      if (updatedProduct) {
        // If successful, redirect back to the products page or send success message
        res.redirect("/rental/rent");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ success: false, message: 'An error occurred while processing the purchase' });
    });
};

exports.getProductDetails = (req, res, next) => {
  const productId = req.params.productId;
  let fetchedProduct;

  RentalProduct.findById(productId)
    .then(product => {
      if (!product) {
        return res.status(404).send("Product not found");
      }
      fetchedProduct = product;
      // Find an active booking for this product
      return RentalBooking.findOne({ product: productId, status: "active" });
    })
    .then(booking => {
      if (booking) {
        // Attach the booking information dynamically
        fetchedProduct.currentBooking = booking;
      }
      res.render("rentals/product-details", {
        pageTitle: fetchedProduct.title,
        product: fetchedProduct,
        activePage: "rental"
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Error fetching product details");
    });
};

exports.updateCart = (req, res, next) => {
  const productId = req.params.productId;
  let newQuantity = parseInt(req.body.quantity);
  const userId = req.user._id;

  // Ensure the new quantity is at least 1
  if (newQuantity < 1) {
    newQuantity = 1;
  }

  // First, verify the product exists and check its available stock
  RentalProduct.findById(productId)
    .then((product) => {
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      // Limit the new quantity to the available stock
      if (newQuantity > product.quantity) {
        newQuantity = product.quantity;
      }
      // Now, find the cart for the user
      return Cart.findOne({ user: userId });
    })
    .then((cart) => {
      if (!cart) {
        // If no cart exists, redirect (or create a new cart if desired)
        return res.redirect("/rental/cart");
      }
      // Find the item in the cart
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );
      if (itemIndex > -1) {
        // Update the quantity
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
  const userId = req.user._id; // assuming the user is authenticated via JWT middleware
  const rentalEnd = req.body.rentalEnd; // Date provided by the user

  // Optionally, validate that rentalEnd is in the future

  // Create a new rental booking
  const booking = new RentalBooking({
    product: productId,
    user: userId,
    rentalEnd: rentalEnd,
  });

  booking.save()
    .then(() => {
      // Optionally, update the product's available quantity or status
      res.redirect("/rental/cart"); // or redirect to a confirmation page
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Error processing your rental.");
    });
};


