// controllers/profileController.js
exports.getProfile = (req, res) => {
    const userProfile = {
        name: "Kanye West",
        email: "kanye@aweso.me",
        city: "San Francisco",
        state: "CA",
        country: "USA",
        phone: "+1 (415) 655-17-10",
        rating: "4.5",
        badge: "new user"
    };

    res.render("profile", { user: userProfile });
};