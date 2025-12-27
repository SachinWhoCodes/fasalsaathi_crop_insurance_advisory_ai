const User = require("../../models/User");

const getRawReports = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const rawReportsObj = Object.fromEntries(user.rawReports);
    res.status(200).json({ rawReports: rawReportsObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = getRawReports;
