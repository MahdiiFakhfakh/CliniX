const express = require("express");
const router = express.Router();
const {
  forgotPassword,
  getMe,
  login,
  refresh,
  register,
  updateProfile,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", protect, refresh);
router.post("/forgot-password", forgotPassword);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

module.exports = router;
