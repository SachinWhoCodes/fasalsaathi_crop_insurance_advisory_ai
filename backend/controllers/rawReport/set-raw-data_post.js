const User = require("../../models/User");

const setRawDataPost = async (req, res) => {
  try {
    const userId = req.body.userid;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const jsonData = req.body;
    const currentLength = user.rawReports.size;
    const i = currentLength + 1;
    const key = `${user._id}_${i}`;

    user.rawReports.set(key, jsonData);
    await user.save();

    res.status(200).json({ message: "Raw data set successfully", key });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = setRawDataPost;
