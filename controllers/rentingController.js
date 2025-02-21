
//homepage for renting
exports.getHome = (req, res, next) => {
  res.render("rentals/rentalHome", {
    pageTitle: "Renting",
    path: "/home",
  });
};

