const { body, validationResult } = require("express-validator");

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  };
};

// Common validation rules
const registerValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("role").isIn(["patient", "doctor", "admin"]),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

const patientValidation = [
  body("firstName").notEmpty().trim(),
  body("lastName").notEmpty().trim(),
  body("dateOfBirth").isISO8601(),
  body("gender").isIn(["male", "female", "other"]),
  body("phone").matches(/^[0-9]{10,15}$/),
];

const appointmentValidation = [
  body("patientId").isMongoId(),
  body("doctorId").isMongoId(),
  body("date").isISO8601(),
  body("time").matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body("reason").notEmpty().trim(),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  patientValidation,
  appointmentValidation,
};
