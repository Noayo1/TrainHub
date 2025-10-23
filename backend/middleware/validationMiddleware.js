// backend/middleware/validationMiddleware.js
// Validation Middleware - Validate request data

const { body, param, query, validationResult } = require("express-validator");

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// User validation rules
exports.validateUserCreation = [
  body("uid").notEmpty().withMessage("User ID is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("displayName")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Display name must be 2-50 characters"),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Role must be either user or admin"),
];

exports.validateUserUpdate = [
  body("displayName")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Display name must be 2-50 characters"),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Role must be either user or admin"),
];

// Post validation rules
exports.validatePostCreation = [
  body("authorId").notEmpty().withMessage("Author ID is required"),
  body("authorName").notEmpty().withMessage("Author name is required"),
  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ max: 5000 })
    .withMessage("Content is too long (max 5000 characters)"),
  body("mediaType")
    .optional()
    .isIn(["image", "video"])
    .withMessage("Media type must be image or video"),
  body("groupId").optional().isString(),
];

exports.validatePostUpdate = [
  body("content")
    .optional()
    .notEmpty()
    .withMessage("Content cannot be empty")
    .isLength({ max: 5000 })
    .withMessage("Content is too long (max 5000 characters)"),
];

// Group validation rules
exports.validateGroupCreation = [
  body("name")
    .notEmpty()
    .withMessage("Group name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Group name must be 2-100 characters"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description is too long (max 500 characters)"),
  body("adminId").notEmpty().withMessage("Admin ID is required"),
  body("isPrivate")
    .optional()
    .isBoolean()
    .withMessage("isPrivate must be a boolean"),
];

exports.validateGroupUpdate = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Group name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Group name must be 2-100 characters"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description is too long (max 500 characters)"),
  body("isPrivate")
    .optional()
    .isBoolean()
    .withMessage("isPrivate must be a boolean"),
];

// ID parameter validation
exports.validateUserId = [
  param("userId").notEmpty().withMessage("User ID is required"),
];

exports.validatePostId = [
  param("postId").notEmpty().withMessage("Post ID is required"),
];

exports.validateGroupId = [
  param("groupId").notEmpty().withMessage("Group ID is required"),
];

// Search validation
exports.validateDateRange = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),
];
