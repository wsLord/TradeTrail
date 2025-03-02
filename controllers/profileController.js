// controllers/profileController.js
exports.getProfile = (req, res) => {
    const userProfile = {
        name: "Kanye West",
        email: "kanye@aweso.me",
        city: "San Francisco",
        state: "CA",
        country: "USA",
        phone: "+1 (415) 655-17-10",
        rating: "53%",
        activity: "90%"
    };

    res.render("profile", { user: userProfile });
};