
//homepage for renting
exports.getHome = (req, res, next) => {
  res.render("rentals/rentalHome", {
    pageTitle: "Renting",
    path: "/rental",
  });
};

//add product form
exports.getAddProduct = (req, res, next) => {
  res.render("rentals/post-product", {
    pageTitle: "Post Product",
    path: "/rental/post",
  });
};

