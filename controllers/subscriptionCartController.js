const Cart = require("../models/subscriptionCart");

exports.getCart = (req, res, next) => {
    const userId = req.user._id;

    Cart.findOne({ user: userId })
        .populate("items.product") // Ensures product details are available
        .then(cart => {
            if (!cart) {
                return res.render("subscriptionSwapping/subscriptionCart", {
                    pageTitle: "Your Cart",
                    subscriptionCart: { items: [] },
                    totalAmount: 0, // Ensure totalAmount is always defined
                    activePage: "subCart", // Set active page for navbar highlighting
                    messages: req.flash() // Pass flash messages if any
                });
            }

            // Calculate total amount
            let totalAmount = cart.items.reduce((sum, item) => {
                return sum + ((item?.product?.price || 0) * (item?.quantity || 0));
            }, 0);
            

            res.render("subscriptionSwapping/subscriptionCart", {
                pageTitle: "Your Cart",
                subscriptionCart: cart,
                totalAmount: totalAmount, // Pass totalAmount to EJS
                activePage: "subCart", // Set active page for navbar highlighting
                messages: req.flash() // Pass flash messages if any
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: "Error fetching cart" });
        });
};
