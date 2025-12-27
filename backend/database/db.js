const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://shaned1618_db_user:oAs1zn3j0CoSaypp@users.ukfzose.mongodb.net/"
    );
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.error("Full error details:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
