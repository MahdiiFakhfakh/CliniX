const User = require("../models/User");
const Admin = require("../models/Admin");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const { generateToken } = require("../utils/jwtUtils");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: "User already exists",
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      role,
    });

    // Create role-specific profile
    let profile;
    if (role === "admin") {
      profile = await Admin.create({
        user: user._id,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        phone,
      });
    } else if (role === "patient") {
      profile = await Patient.create({
        user: user._id,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        phone,
      });
    } else if (role === "doctor") {
      profile = await Doctor.create({
        user: user._id,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        phone,
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Check password (using the method from User model)
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Get user profile
    let profile;
    if (user.role === "admin") {
      profile = await Admin.findOne({ user: user._id });
    } else if (user.role === "patient") {
      profile = await Patient.findOne({ user: user._id });
    } else if (user.role === "doctor") {
      profile = await Doctor.findOne({ user: user._id });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // This would be implemented with auth middleware
    res.json({
      success: true,
      message: "Get current user endpoint",
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
};
