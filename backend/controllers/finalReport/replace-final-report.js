const User = require("../../models/User");

const replaceFinalReport = async (req, res) => {
  try {
    const { userid, report_id, report } = req.body;
    const user = await User.findById(userid);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!report_id || !report) {
      return res
        .status(400)
        .json({ message: "report_id and report are required" });
    }

    if (
      !user.finalReports ||
      typeof user.finalReports !== "object" ||
      !user.finalReports.has
    ) {
      user.finalReports = new Map();
    }

    if (!user.finalReports.has(report_id)) {
      return res
        .status(404)
        .json({ message: "Report not found for the given report_id" });
    }

    user.finalReports.set(report_id, report);
    await user.save();

    res
      .status(200)
      .json({ message: "Final report replaced successfully", report_id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = replaceFinalReport;
