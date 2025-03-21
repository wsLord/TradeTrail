// controllers/profileController.js
const User = require('../models/userModel');

exports.getProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user._id);

        // Add default badges if none exist
        if (!user.badges || user.badges.length === 0) {
        user.badges = [
          '/badges/badgeone.png',
          '/badges/badgetwo.png',
          '/badges/badgethree.png'
        ];
      }
      res.render("profile", { 
        user: user,
        activePage: "profile"
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  exports.updateProfile = async (req, res) => {
    try {
      const { city, state, country, phone } = req.body;
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { city, state, country, phone },
        { new: true }
      );
      res.redirect("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  exports.updateProfilePic = async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { profilePic: req.file.path },
        { new: true }
      );
      res.json({ success: true, profilePic: user.profilePic });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ success: false });
    }
  };
