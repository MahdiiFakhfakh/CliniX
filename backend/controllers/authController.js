const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const User = require("../models/User");

const tokenize = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "1h",
  });
};

const safeString = (value, fallback = "") => {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
};

const splitFullName = (fullName) => {
  const normalized = safeString(fullName);
  if (!normalized) {
    return { firstName: "", lastName: "" };
  }

  const parts = normalized.split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ").trim();

  return {
    firstName,
    lastName: lastName || firstName,
  };
};

const mapRoleProfile = async (user) => {
  if (user.role === "doctor") {
    const doctor = await Doctor.findOne({ user: user._id }).lean();
    return {
      fullName: safeString(doctor?.fullName, safeString(user.name, "Doctor")),
      department: safeString(
        doctor?.department,
        safeString(doctor?.specialization, "Clinical"),
      ),
      phone: safeString(doctor?.phone),
    };
  }

  if (user.role === "patient") {
    const patient = await Patient.findOne({ user: user._id }).lean();
    return {
      fullName: safeString(patient?.fullName, safeString(user.name, "Patient")),
      department: "Patient Care",
      phone: safeString(patient?.phone),
    };
  }

  if (user.role === "admin") {
    const admin = await Admin.findOne({ user: user._id }).lean();
    return {
      fullName: safeString(admin?.fullName, safeString(user.name, "Admin")),
      department: safeString(admin?.department, "Management"),
      phone: safeString(admin?.phone),
    };
  }

  return {
    fullName: safeString(user.name, user.email.split("@")[0]),
    department: "",
    phone: "",
  };
};

const mapAuthUser = async (user) => {
  const profile = await mapRoleProfile(user);

  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: profile.fullName,
    department: profile.department,
    phone: profile.phone,
    profile,
  };
};

const isRoleMismatch = (requestedRole, actualRole) => {
  if (!requestedRole) {
    return false;
  }

  const normalized = safeString(requestedRole).toLowerCase();
  if (!normalized) {
    return false;
  }

  if (normalized === actualRole) {
    return false;
  }

  // Admin credentials can be used when doctor role is selected in mobile.
  if (normalized === "doctor" && actualRole === "admin") {
    return false;
  }

  return true;
};

// @desc Login user
// @route POST /api/auth/login
exports.login = async (req, res) => {
  const email = safeString(req.body?.email).toLowerCase();
  const password = safeString(req.body?.password);
  const requestedRole = safeString(req.body?.role).toLowerCase();

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Email and password are required",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const passwordMatches = await user.matchPassword(password);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    if (isRoleMismatch(requestedRole, user.role)) {
      return res.status(403).json({
        success: false,
        error: "Account role does not match selected role",
      });
    }

    const token = tokenize(user._id, user.role);
    const mappedUser = await mapAuthUser(user);

    return res.json({
      success: true,
      token,
      user: mappedUser,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc Refresh access token
// @route POST /api/auth/refresh
exports.refresh = async (req, res) => {
  try {
    const token = tokenize(req.user._id, req.user.role);
    return res.json({ success: true, token });
  } catch (error) {
    console.error("Refresh error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to refresh token" });
  }
};

// @desc Forgot password (placeholder)
// @route POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const email = safeString(req.body?.email).toLowerCase();

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  try {
    await User.findOne({ email }).lean();

    return res.json({
      success: true,
      message:
        "If an account exists for this email, password reset instructions have been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process forgot password request",
    });
  }
};

// @desc Get current user profile
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const mappedUser = await mapAuthUser(user);

    return res.json({
      success: true,
      user: mappedUser,
    });
  } catch (error) {
    console.error("Get /auth/me error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to load user profile" });
  }
};

// @desc Update profile for current user
// @route PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  const fullName = safeString(req.body?.fullName);
  const email = safeString(req.body?.email).toLowerCase();
  const phone = safeString(req.body?.phone);
  const department = safeString(req.body?.department);

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (email) {
      user.email = email;
    }

    if (fullName) {
      user.name = fullName;
    }

    await user.save();

    if (user.role === "doctor") {
      const doctor = await Doctor.findOne({ user: user._id });
      if (doctor) {
        if (fullName) {
          const names = splitFullName(fullName);
          doctor.firstName = names.firstName || doctor.firstName;
          doctor.lastName = names.lastName || doctor.lastName;
          doctor.fullName = fullName;
        }

        if (email) {
          doctor.email = email;
        }

        if (phone) {
          doctor.phone = phone;
        }

        if (department) {
          doctor.department = department;
        }

        await doctor.save();
      }
    }

    if (user.role === "patient") {
      const patient = await Patient.findOne({ user: user._id });
      if (patient) {
        if (fullName) {
          const names = splitFullName(fullName);
          patient.firstName = names.firstName || patient.firstName;
          patient.lastName = names.lastName || patient.lastName;
          patient.fullName = fullName;
        }

        if (email) {
          patient.email = email;
        }

        if (phone) {
          patient.phone = phone;
        }

        await patient.save();
      }
    }

    if (user.role === "admin") {
      const admin = await Admin.findOne({ user: user._id });
      if (admin) {
        if (fullName) {
          const names = splitFullName(fullName);
          admin.firstName = names.firstName || admin.firstName;
          admin.lastName = names.lastName || admin.lastName;
          admin.fullName = fullName;
        }

        if (phone) {
          admin.phone = phone;
        }

        if (department) {
          admin.department = department;
        }

        await admin.save();
      }
    }

    const mappedUser = await mapAuthUser(user);

    return res.json({
      success: true,
      user: mappedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        error: "Email already in use",
      });
    }

    return res
      .status(500)
      .json({ success: false, error: "Failed to update profile" });
  }
};