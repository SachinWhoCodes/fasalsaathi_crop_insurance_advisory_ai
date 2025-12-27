const session = require("express-session");

const session_secret_key =
  process.env.SESSION_SECRET ||
  "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4";

const sessionMiddleware = session({
  secret: session_secret_key,
  resave: false,
  saveUninitialized: true, 
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
});

module.exports = sessionMiddleware;
