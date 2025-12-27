const User = require("../models/User");

const getUserdetails = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId).select("email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = getUserdetails;
