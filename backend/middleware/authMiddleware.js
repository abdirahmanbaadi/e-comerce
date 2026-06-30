const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = 'mogadishu_modern_furniture_secret_key_2026'; // Simple local secret

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
      const user = await User.findByPk(decoded.id);
      
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

module.exports = { protect, authorize, JWT_SECRET };
