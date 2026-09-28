const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

/**
 * Normalizes system roles to standard lowercase representation:
 * 'ADMIN' -> 'admin'
 * 'PROJECT_MANAGER' / 'MANAGER' -> 'manager'
 * 'EMPLOYEE' -> 'employee'
 */
const normalizeRole = (role) => {
  if (!role) return 'employee';
  const r = role.toString().trim().toUpperCase();
  if (r === 'ADMIN') return 'admin';
  if (r === 'PROJECT_MANAGER' || r === 'MANAGER') return 'manager';
  if (r === 'EMPLOYEE') return 'employee';
  return role.toLowerCase();
};

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_jwt_key_for_employee_project_mgmt_2026');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = user;
    req.userRole = normalizeRole(user.role);

    // Bind corresponding employee document by email if present
    try {
      if (user.email) {
        req.employee = await Employee.findOne({ email: user.email.toLowerCase() });
      }
    } catch (e) {
      req.employee = null;
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Invalid or expired token.',
    });
  }
};

// Optional protect middleware: if token is present, sets req.user & req.employee; otherwise proceeds as guest
const optionalProtect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_jwt_key_for_employee_project_mgmt_2026');
    const user = await User.findById(decoded.id).select('-password');
    if (user) {
      req.user = user;
      req.userRole = normalizeRole(user.role);
      if (user.email) {
        req.employee = await Employee.findOne({ email: user.email.toLowerCase() });
      }
    }
  } catch (err) {
    // Continue without req.user
  }
  next();
};

const authorize = (...roles) => {
  const allowed = roles.map((r) => normalizeRole(r));
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource. Authentication required.',
      });
    }

    const currentRole = normalizeRole(req.user.role);
    if (!allowed.includes(currentRole)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role || 'Guest'}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

// Alias for backwards-compatibility with Prethiksha's authentication naming
const authenticate = protect;

module.exports = {
  protect,
  authenticate,
  optionalProtect,
  authorize,
  normalizeRole,
};


