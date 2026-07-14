const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// Protect routes - require valid JWT
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        res.status(401);
        throw new Error("User not found");
      }
      return next();
    } catch (err) {
      res.status(401);
      throw new Error("Not authorized, token invalid or expired");
    }
  }

  res.status(401);
  throw new Error("Not authorized, no token provided");
});

// Restrict to admin role
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  res.status(403);
  throw new Error("Not authorized as an admin");
};

// Require an active "pro" plan
const requirePro = (req, res, next) => {
  if (req.user && (req.user.plan === "pro" || req.user.role === "admin")) {
    return next();
  }
  res.status(403);
  throw new Error("This feature requires a Pro subscription");
};

module.exports = { protect, admin, requirePro };

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    }
  } catch (_) {}
  next();
};

// update exports:
module.exports = { protect, optionalAuth };

