const jwt = require('jsonwebtoken');
const User = require('../models/User');

if (!process.env.JWT_SECRET) {
  console.warn('[SECURITY] JWT_SECRET is not set. Using development fallback — set JWT_SECRET in production.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'mogadishu_modern_furniture_dev_only';

// Protect routes - Verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from the token
      const user = await User.findOne({ id: decoded.id });
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'Fadlan dib u soo gal, isticmaalahaan lama helin!' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Codsi aan la oggolayn, Token khaldan!' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Codsi aan la oggolayn, Token lama helin!' });
  }
};

// Restrict access to specific roles (e.g. 'admin', 'delivery')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Malahid awood aad ku fuliso hawshaan. Doorkaaga (${req.user ? req.user.role : 'None'}) laguma oggola.`
      });
    }
    next();
  };
};

// Optional auth — attaches req.user when token is valid, continues as guest otherwise
const optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ id: decoded.id });
    if (user) req.user = user;
  } catch (error) {
    // Ignore invalid token for public checkout
  }

  return next();
};

module.exports = { protect, optionalProtect, authorize, JWT_SECRET };
