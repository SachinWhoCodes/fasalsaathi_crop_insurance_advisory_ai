const authenticateUser = (req, res, next) => {
  console.log("Session in authenticateUser:", req.session);
  if (!req.session.user || !req.session.user._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

module.exports = authenticateUser;
