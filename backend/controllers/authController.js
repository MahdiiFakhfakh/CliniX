const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "1h",
  });
};

// @desc Login user (admin only)
// @route POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    // 2️⃣ Check password (assuming User model has matchPassword method)
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    // 3️⃣ Check admin role
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({
          success: false,
          error: "Access denied: Only admins can login",
        });
    }

    // 4️⃣ Generate token
    const token = generateToken(user._id, user.role);

    // 5️⃣ Send response
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: {
          fullName: user.name,
          department: user.department || "",
          phone: user.phone || "",
        },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
