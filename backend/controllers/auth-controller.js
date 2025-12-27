const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "X7k9pL8mQ2vW3xY4zA5bC6dE7fG8hI9jK0lM1nO2pQ3rS4tU5v"; 

async function getCityStateFromCoordinates(latitude, longitude) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "FasalSaathi/1.0 (contact@fasalsaathi.com)",
      },
      timeout: 10000,
    });
    const address = response.data.address;
    return {
      city:
        address.city || address.town || address.village || address.county || "",
      state: address.state || address.region || "",
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error.message);
    return { city: "Unknown", state: "Unknown" };
  }
}

exports.register = async (req, res) => {
  const { name, email, password, phone, location } = req.body;

  try {
    console.log("Register attempt:", {
      name,
      email,
      phone: phone ? "provided" : "missing",
      location: location ? "provided" : "missing",
    });

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ msg: "Name, email, and password are required" });
    }

    if (!email.includes("@") || !email.includes(".")) {
      return res
        .status(400)
        .json({ msg: "Please provide a valid email address" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ msg: "Password must be at least 6 characters long" });
    }

    let user = await User.findOne({ email });
    if (user) {
      console.log("User already exists for email:", email);
      return res.status(400).json({ msg: "User already exists" });
    }

    console.log("Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Password hashed successfully");

    let city = "Unknown";
    let state = "Unknown";
    if (location && location.latitude && location.longitude) {
      console.log("Getting city/state from coordinates...");
      const cityState = await getCityStateFromCoordinates(
        location.latitude,
        location.longitude
      );
      city = cityState.city;
      state = cityState.state;
      console.log("Location resolved:", { city, state });
    }

    console.log("Creating new user...");
    user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      location: {
        city,
        state,
        latitude: location?.latitude,
        longitude: location?.longitude,
      },
    });

    await user.save();
    console.log("User saved:", user._id);

    const payload = { userId: user._id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2 days" });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
    };

    req.session.user = { _id: user._id }; 

    console.log("Registration successful");
    res.status(201).json({ token, user: userData });
  } catch (err) {
    console.error("Register error details:", {
      message: err.message,
      name: err.name,
      stack: err.stack,
    });

    if (
      err.name === "MongoNetworkError" ||
      err.message.includes("MongoNetworkError")
    ) {
      return res
        .status(503)
        .json({ msg: "Database connection failed. Please try again later." });
    }

    if (err.name === "MongoError" || err.code === 11000) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    res.status(500).json({ msg: "Server error during registration" });
  }
};

   exports.login = async (req, res) => {
     const { email, password } = req.body;

     try {
       console.log("Login attempt for email:", email);

       if (!email || !password) {
         return res
           .status(400)
           .json({ msg: "Email and password are required" });
       }

       let user = await User.findOne({ email: email.toLowerCase().trim() });
       if (!user) {
         console.log("User not found for email:", email);
         return res.status(400).json({ msg: "Invalid credentials" });
       }

       console.log("Comparing passwords...");
       const isMatch = await bcrypt.compare(password, user.password);
       if (!isMatch) {
         console.log("Password mismatch");
         return res.status(400).json({ msg: "Invalid credentials" });
       }

       console.log("Password match confirmed");

       const payload = { userId: user._id };
       const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

       const userData = {
         id: user._id,
         name: user.name,
         email: user.email,
         phone: user.phone,
         location: user.location,
       };

       req.session.user = { _id: user._id }; 
       req.session.save((err) => {
         if (err) console.error("Session save error:", err);
         else console.log("Session saved:", req.session.user);
       });

       console.log("Login successful, session:", req.session);
       res.json({ token, user: user._id });
     } catch (err) {
       console.error("Login error:", err.message, err.stack);
       res.status(500).json({ msg: "Server error during login" });
     }
   };


exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.userId).select("-password");
    if (!req.user) {
      return res.status(401).json({ msg: "User not found" });
    }
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.status(401).json({ msg: "Token is invalid" });
  }
};
