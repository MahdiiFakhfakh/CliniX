const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private/Admin
exports.getAllPatients = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { patientId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const patients = await Patient.find(query)
      .populate("primaryDoctor", "firstName lastName specialization")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Patient.countDocuments(query);

    res.json({
      success: true,
      count: patients.length,
      data: patients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error("Get patients error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private/Admin
exports.getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate(
        "primaryDoctor",
        "firstName lastName specialization phone email",
      )
      .populate("currentMedications.prescribedBy", "firstName lastName");

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: "Patient not found",
      });
    }

    // Get patient appointments
    const appointments = await Appointment.find({ patient: patient._id })
      .populate("doctor", "firstName lastName specialization")
      .sort({ date: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        patient,
        appointments,
      },
    });
  } catch (error) {
    console.error("Get patient error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Create patient
// @route   POST /api/patients
// @access  Private/Admin
exports.createPatient = async (req, res) => {
  try {
    const patient = await Patient.create(req.body);

    res.status(201).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("Create patient error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Patient with this email or phone already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private/Admin
exports.updatePatient = async (req, res) => {
  try {
    let patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: "Patient not found",
      });
    }

    patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("Update patient error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private/Admin
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: "Patient not found",
      });
    }

    await patient.deleteOne();

    res.json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error("Delete patient error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update patient status
// @route   PUT /api/patients/:id/status
// @access  Private/Admin
exports.updatePatientStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: "Patient not found",
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("Update patient status error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get patient statistics
// @route   GET /api/patients/stats
// @access  Private/Admin
exports.getPatientStats = async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const activePatients = await Patient.countDocuments({ status: "active" });
    const newPatientsThisMonth = await Patient.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    });

    // Age distribution
    const ageDistribution = await Patient.aggregate([
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ["$age", 18] }, then: "0-17" },
                { case: { $lt: ["$age", 30] }, then: "18-29" },
                { case: { $lt: ["$age", 45] }, then: "30-44" },
                { case: { $lt: ["$age", 60] }, then: "45-59" },
              ],
              default: "60+",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Gender distribution
    const genderDistribution = await Patient.aggregate([
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalPatients,
        activePatients,
        newPatientsThisMonth,
        ageDistribution,
        genderDistribution,
      },
    });
  } catch (error) {
    console.error("Get patient stats error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
