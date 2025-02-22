const RentalProduct = require('../models/rentalProduct');

// Homepage for Renting
exports.getHome = (req, res, next) => {
  res.render("rentals/rentalHome", {
    pageTitle: "Renting",
    path: "/rental",
  });
};

// Add Product Form (Post an item for rent)
exports.getAddProduct = (req, res, next) => {
  res.render("rentals/post-product", {
    pageTitle: "Post Product",
    path: "/rental/post",
  });
};

// Saving rental item in the database
exports.postAddProduct = (req, res, next) => {
  const { title, imageUrl, price, description, location, rate } = req.body;

  // Validate if all required fields are filled
  if (!title || !imageUrl || !price || !description || !location || !rate) {
    return res.status(400).send('All fields are required!');
  }

  const rentalProduct = new RentalProduct({
    title: title,
    imageUrl: imageUrl,
    price: price,
    description: description,
    location: location,
    rate: rate,  // Save rate directly as per the form
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

// Get all rental items
exports.getRentItems = (req, res, next) => {
  RentalProduct.find()
    .then((products) => {
      res.render("rentals/rent-items", {
        pageTitle: "Available Rentals",
        path: "/rental/rent",
        products: products,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("An error occurred while fetching rental items.");
    });
};
