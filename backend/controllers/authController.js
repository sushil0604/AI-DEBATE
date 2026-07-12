const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide name, email, and password");
  }

  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    res.status(400);
    throw new Error("A user with that email already exists");
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    user: user.toPublicJSON(),
    token: generateToken(user._id),
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({
    success: true,
    user: user.toPublicJSON(),
    token: generateToken(user._id),
  });
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user: user.toPublicJSON() });
});

// @desc    Update profile (name/avatar)
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (req.body.name) user.name = req.body.name;
  if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
  if (req.body.password) user.password = req.body.password;

  const updated = await user.save();
  res.json({ success: true, user: updated.toPublicJSON() });
});

module.exports = { registerUser, loginUser, getMe, updateMe };
