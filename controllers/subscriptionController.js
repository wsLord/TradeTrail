const Ott = require("../models/ott");
exports.getHome = (req, res, next) => {
    res.render("subscriptionSwapping/subscriptionHome", {
        pageTitle: "Subscription Swapping",
        path: "/subscription",
    });
};
exports.getAddProduct = (req, res, next) => {
    res.render("subscriptionSwapping/add-product", {
        pageTitle: "Add Product",
        path: "/subscription/sell",
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
    const product = new Ott({
        platform_name: title,
        imageUrl: imageUrl,
        price: price,
        min_price: min_price,
        description: description,
        startDate: startDate,
        endDate: endDate,
    });
    product
        .save()
        .then((result) => {
            console.log("Created Product");

            res.redirect("/subscription/buy");
        })
        .catch((err) => {
            console.log(err);
        });
};
exports.getProducts = (req, res, next) => {
    Ott.find()
        .then((products) => {
            res.render("subscriptionSwapping/buy", {
                prods: products,
                pageTitle: "All Products",
                path: "/products",
            });
        })
        .catch((err) => {
            console.log(err);
        });
};