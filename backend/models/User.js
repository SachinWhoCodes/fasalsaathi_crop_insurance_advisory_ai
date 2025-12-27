const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  location: {
    city: String,
    state: String,
    latitude: Number,
    longitude: Number,
  },
  rawReports: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  finalReports: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

module.exports = mongoose.model("User", UserSchema);
