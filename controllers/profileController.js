// controllers/profileController.js
exports.getProfile = (req, res) => {
    const userProfile = {
        name: "Name Surname",
        email: "name@dummy.com",
        city: "New Delhi",
        state: "Delhi",
        country: "India",
        phone: "+91 415-655-17-10",
        rating: "4.5",
        badge: "new user",

        badges: [
            '/badges/badgeone.png',
            '/badges/badgetwo.png',
            '/badges/badgethree.png'
        ]
    };
    
    res.render("profile", { 
        user: userProfile,
        activePage: "profile"  // Added activePage for navbar highlighting
    });
};
