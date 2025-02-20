exports.getHome = (req, res, next) => {
  res.render("homepage", {
    path: "/home",
  });
};
