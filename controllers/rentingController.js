const RentalProduct = require("../models/rentalProduct");
const RentalBooking = require("../models/rentalBooking");
const Cart = require("../models/cartModel");

async function clearExpiredRentals() {
  const currentDate = new Date();
  const expiredRentals = await RentalBooking.find({ rentalEnd: { $lt: currentDate }, status: "active" });

  for (const rental of expiredRentals) {
    await RentalProduct.findByIdAndUpdate(rental.product, {
      buyer: null,
      currentBooking: null
    });

    await RentalBooking.findByIdAndUpdate(rental._id, {
      status: "completed"
    });
  }

  console.log('Expired rentals cleared and updated.');
}

// Add-to-Cart Controller Method
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.productId;
    const { rentalStart, rentalEnd } = req.body;


    // Validate dates
    if (!rentalStart || !rentalEnd) {
      req.flash("error", "Please select rental dates");
      return res.redirect(`/rental/details/${productId}`);
    }

    const product = await RentalProduct.findById(productId);
    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("/rental/rent");
    }

    // Check product availability
    if (product.quantity < 1) {
      req.flash("error", "This product is currently out of stock");
      return res.redirect(`/rental/details/${productId}`);
    }

    // Check existing cart quantity
    const cart = await Cart.findOne({ user: userId });
    let existingQuantity = 0;

    if (cart) {
      const existingItem = cart.items.find(
        item => item.product.toString() === productId && 
                item.productType === "Rental"
      );
      existingQuantity = existingItem ? existingItem.quantity : 0;
    }

    const totalRequested = existingQuantity + 1; // Since we're adding 1 item

    if (totalRequested > product.quantity) {
      req.flash(
        "error",
        // `Cannot add more items. Only ${product.quantity - existingQuantity} available in stock.`
        `Cannot add more than the quantity available.`
      );
      return res.redirect(`/rental/details/${productId}`);
    }

    // Calculate rental duration
    const startDate = new Date(rentalStart);
    const endDate = new Date(rentalEnd);
    const diffTime = Math.abs(endDate - startDate);
    
    let units;
    switch(product.rate) {
      case 'hour': units = diffTime / (1000 * 60 * 60); break;
      case 'day': units = diffTime / (1000 * 60 * 60 * 24); break;
      case 'week': units = diffTime / (1000 * 60 * 60 * 24 * 7); break;
      case 'month': units = diffTime / (1000 * 60 * 60 * 24 * 30); break;
    }
    const calculatedPrice = Math.ceil(units) * product.price;

    // Update cart logic
    const updatedCart = cart || new Cart({ user: userId });
    
    const existingItemIndex = updatedCart.items.findIndex(
      item => item.product.toString() === productId && 
              item.productType === "Rental"
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
        securityDeposit: product.securityDeposit
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

// Homepage for Renting
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
  const { title, price, description, location, rate, quantity, securityDeposit  } = req.body;

  if (!req.files || req.files.length === 0) {
    console.log("No files uploaded!");
    return res.status(400).send("At least one image is required.");
  }

  const imageUrls = req.files.map(file => file.path); // Get Cloudinary image URLs
 if (!title || !imageUrls || !price || !description || !location || !rate || !quantity || !securityDeposit) {
    return res.status(400).send('All fields are required!');
  }

  const rentalProduct = new RentalProduct({
    title: title,
    imageUrls: imageUrls,
    price: price,
    description: description,
    location: location,
    rate: rate,  // Save rate directly as per the form
    quantity: quantity,
    securityDeposit: securityDeposit,  // Save quantity directly
    seller: req.user._id,

  });

  rentalProduct
    .save()
    .then(() => {
      console.log("Rental Product Posted Successfully!");
      res.redirect("/rental/rent");
    })
    .catch((err) => {
      console.error("Error saving product:", err);
      res
        .status(500)
        .send("An error occurred while saving the rental product.");
    });
};

// Get all rental items (with search)
exports.getRentItems = (req, res, next) => {
  const searchQuery = req.query.search || "";
  const query = {};

  if (searchQuery) {
    query.$or = [
      { title: { $regex: searchQuery, $options: "i" } },
      { description: { $regex: searchQuery, $options: "i" } },
      { location: { $regex: searchQuery, $options: "i" } },
    ];
  }

  RentalProduct.find(query)
    .then((products) => {
      res.render("rentals/rent-items", {
        pageTitle: "Available Rentals",
        path: "/rental/rent",
        products: products,
        searchQuery: searchQuery,
        activePage: "rental",
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
  .populate("seller", "fullName")
    .then((product) => {
      if (product) {
        // If the product has sufficient stock, decrement the quantity
        if (product.quantity > 0) {
          product.quantity -= 1; // Decrement the quantity by 1
          return product.save(); // Save the updated product data to the DB
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
        // If successful, redirect back to the products page or send success message
        res.redirect("/rental/rent");
      }
    })
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .json({
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
  .populate('buyer', 'fullName')
    .then((product) => {
      if (!product) {
        return res.status(404).send("Product not found");
      }
      console.log(product);
      
      fetchedProduct = product;
      // Find an active booking for this product
      return RentalBooking.findOne({ product: productId, status: "active" }).populate("user", "fullName");
    })
    .then((booking) => {
      if (booking) {
        // Attach the booking information dynamically
        fetchedProduct.currentBooking = booking;
        // fetchedProduct.populate('booking.user','fullName');
        console.log(booking);
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

  booking
    .save()
    .then(() => {
      // Optionally, update the product's available quantity or status
      res.redirect("/rental/cart"); // or redirect to a confirmation page
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error processing your rental.");
    });
};
