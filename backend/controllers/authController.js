const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const UserActivity = require('../models/UserActivity');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { findUserByPhone, maskEmail, normalizePhone } = require('../utils/phoneUtils');
const { sendWelcomeEmail, sendPasswordResetCode, isEmailConfigured } = require('../services/emailService');
const { sendPasswordResetSms, isSmsConfigured, maskPhone } = require('../services/smsService');
const { logUserActivity } = require('../services/activityService');
const {
  hashOtp,
  validatePassword,
  allowSeedPasswordUpgrade,
  MAX_OTP_ATTEMPTS,
} = require('../utils/securityUtils');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

function formatPublicUser(user) {
  const prefs = user.notificationPreferences || {};
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    avatar: user.avatar,
    notificationPreferences: {
      emailAlerts: prefs.emailAlerts !== false,
      smsAlerts: prefs.smsAlerts === true,
      pushAlerts: prefs.pushAlerts === true,
      securityEmail: prefs.securityEmail !== false,
      securitySms: prefs.securitySms !== false,
    },
    driverApplication: user.driverApplication
      ? {
          status: user.driverApplication.status || 'none',
          district: user.driverApplication.district || '',
          vehicleType: user.driverApplication.vehicleType || '',
          experience: user.driverApplication.experience || '',
          availability: user.driverApplication.availability || '',
          appliedAt: user.driverApplication.appliedAt || null,
          reviewedAt: user.driverApplication.reviewedAt || null,
          rejectReason: user.driverApplication.rejectReason || '',
        }
      : { status: 'none' },
    passwordChangedAt: user.passwordChangedAt || null,
    lastLoginAt: user.lastLoginAt || null,
  };
}

async function verifyUserPassword(user, password) {
  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) return true;
  if (allowSeedPasswordUpgrade() && user.password === password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    return true;
  }
  return false;
}

function otpIsValid(user, code) {
  if (!user.resetOtp || !code) return false;
  return user.resetOtp === hashOtp(String(code).trim());
}

async function registerOtpFailure(user) {
  user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
  if (user.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
    user.resetOtp = '';
    user.resetOtpExpires = null;
  }
  await user.save();
}

async function linkGuestOrdersToUser(user) {
  const normalized = normalizePhone(user.phone);
  if (!normalized) return;

  const suffix = normalized.slice(-9);
  const guestOrders = await Order.find({
    $or: [{ userId: '' }, { userId: null }, { userId: { $exists: false } }],
    phone: { $regex: `${suffix}$` },
  }).limit(50);

  for (const order of guestOrders) {
    if (normalizePhone(order.phone) === normalized) {
      order.userId = user.id;
      if (!order.email && user.email) order.email = user.email;
      await order.save();
    }
  }
}

// Register User
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields!' });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.ok) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    // Check if user exists by email
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'This email is already registered!' });
    }

    // Check if user exists by phone (normalized match)
    const phoneExists = await findUserByPhone(User, phone);
    if (phoneExists) {
      return res.status(400).json({ success: false, message: 'This phone number is already registered!' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User ID
    const userId = "USR-" + (Math.floor(Math.random() * 90000) + 10000);

    // Create User
    const user = await User.create({
      id: userId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: 'user', // Default role is user
      passwordChangedAt: new Date(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + (lastName || ''))}&background=073D35&color=ffffff&bold=true&size=128`
    });

    sendWelcomeEmail(user).catch((err) => console.error('Welcome email failed:', err.message));
    linkGuestOrdersToUser(user).catch((err) => console.error('Link guest orders failed:', err.message));

    logUserActivity({
      userId: user.id,
      action: 'register',
      description: 'New customer account registered.',
      metadata: { email: user.email, phone: user.phone },
    }).catch((err) => console.error('Activity log failed:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token: generateToken(user.id),
      user: formatPublicUser(user),
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'This email or phone is already registered!' });
    }
    return res.status(500).json({ success: false, message: 'A server error occurred during registration.' });
  }
};

// Login User (email or phone + password)
exports.login = async (req, res) => {
  try {
    const { email, login, password } = req.body;
    const identifier = (login || email || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please enter email/phone and password!' });
    }

    let user = null;
    if (identifier.includes('@')) {
      user = await User.findOne({ email: identifier.toLowerCase() });
    } else {
      user = await findUserByPhone(User, identifier);
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'Incorrect email/phone or password!' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact support.' });
    }

    const validPassword = await verifyUserPassword(user, password);
    if (!validPassword) {
      return res.status(400).json({ success: false, message: 'Incorrect email/phone or password!' });
    }

    linkGuestOrdersToUser(user).catch((err) => console.error('Link guest orders failed:', err.message));

    user.lastLoginAt = new Date();
    await user.save();

    await logUserActivity({
      userId: user.id,
      action: 'login',
      description: `Signed in as ${user.role}.`,
      metadata: { role: user.role },
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token: generateToken(user.id),
      user: formatPublicUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'A server error occurred during login.' });
  }
};

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }

    return res.status(200).json({
      success: true,
      user: formatPublicUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
};

exports.getSecurityInfo = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }

    return res.status(200).json({
      success: true,
      security: {
        passwordChangedAt: user.passwordChangedAt,
        lastLoginAt: user.lastLoginAt,
        role: user.role,
        accountActive: user.isActive !== false,
        twoFactorEnabled: false,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load security info.' });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone, address, avatar, notificationPreferences } = req.body;
    const user = await User.findOne({ id: req.user.id });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }

    // Split full name into first and last name
    if (fullName) {
      const parts = fullName.trim().split(' ');
      user.firstName = parts[0] || '';
      user.lastName = parts.slice(1).join(' ') || '';
    }

    if (phone) {
      // Check if phone already registered by another user
      const phoneExists = await User.findOne({ phone });
      if (phoneExists && phoneExists.id !== user.id) {
        return res.status(400).json({ success: false, message: 'This phone number is already registered to another account!' });
      }
      user.phone = phone;
    }

    if (address !== undefined) {
      user.address = address;
    }

    if (avatar) {
      user.avatar = avatar;
    }

    if (notificationPreferences && typeof notificationPreferences === 'object') {
      user.notificationPreferences = {
        ...user.notificationPreferences?.toObject?.() || user.notificationPreferences || {},
        ...notificationPreferences,
      };
    }

    await user.save();

    await logUserActivity({
      userId: user.id,
      action: 'profile_update',
      description: 'Profile information updated.',
    });

    return res.status(200).json({
      success: true,
      message: 'Your profile has been updated successfully!',
      user: formatPublicUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findOne({ id: req.user.id });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }

    const validCurrent = await verifyUserPassword(user, currentPassword);
    if (!validCurrent) {
      return res.status(400).json({ success: false, message: 'Incorrect current password!' });
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.ok) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordChangedAt = new Date();
    await user.save();

    await logUserActivity({
      userId: user.id,
      action: 'password_change',
      description: 'Password changed successfully.',
    });

    return res.status(200).json({ success: true, message: 'Your password has been changed successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};

// Forgot Password - Step 1: Send OTP to registered email (primary method)
exports.sendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !String(email).includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter your registered email address!' });
    }

    const targetUser = await User.findOne({ email: email.toLowerCase().trim() });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'This email is not registered!' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    targetUser.resetOtp = hashOtp(otp);
    targetUser.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    targetUser.resetOtpAttempts = 0;
    await targetUser.save();

    if (!isEmailConfigured()) {
      console.log(`[Password Reset OTP] ${targetUser.email}: ${otp}`);
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured on the server. Please contact support.',
      });
    }

    const emailResult = await sendPasswordResetCode(targetUser, otp);
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Could not send verification email. Please try again later.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code was sent to ${maskEmail(targetUser.email)}`,
      email: targetUser.email,
      maskedEmail: maskEmail(targetUser.email),
      channel: 'email',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to send verification code.' });
  }
};

// Forgot Password - Step 1: Phone → SMS OTP (email fallback if SMS unavailable)
exports.verifyPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please enter your phone number!' });
    }

    const targetUser = await findUserByPhone(User, phone);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'This phone number is not registered!' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    targetUser.resetOtp = hashOtp(otp);
    targetUser.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    targetUser.resetOtpAttempts = 0;
    await targetUser.save();

    const payload = {
      success: true,
      email: targetUser.email,
      maskedEmail: maskEmail(targetUser.email),
      maskedPhone: maskPhone(targetUser.phone),
      phone: targetUser.phone,
    };

    const smsResult = await sendPasswordResetSms(targetUser.phone, otp);
    if (smsResult.success) {
      sendPasswordResetCode(targetUser, otp).catch(() => {});
      return res.status(200).json({
        ...payload,
        channel: 'sms',
        message: `A 6-digit code was sent via SMS to ${maskPhone(targetUser.phone)}.`,
      });
    }

    if (isEmailConfigured()) {
      const emailResult = await sendPasswordResetCode(targetUser, otp);
      if (emailResult.success) {
        return res.status(200).json({
          ...payload,
          channel: 'email',
          message: `SMS unavailable. Code sent to ${maskEmail(targetUser.email)} instead.`,
        });
      }
    }

    if (!isSmsConfigured() && !isEmailConfigured()) {
      console.log(`[Password Reset OTP] ${targetUser.phone}: ${otp}`);
      return res.status(200).json({
        ...payload,
        channel: 'dev',
        message: `Test mode: use code ${otp} (configure SMS or SMTP for production).`,
      });
    }

    return res.status(500).json({
      success: false,
      message: smsResult.message || 'Could not send verification code. Try again later.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to verify phone number.' });
  }
};

// Forgot Password - Step 2: Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, phone, code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please enter the verification code!' });
    }

    let user = null;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else if (phone) {
      user = await findUserByPhone(User, phone);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }

    if ((user.resetOtpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Request a new verification code.',
      });
    }

    if (!otpIsValid(user, code)) {
      await registerOtpFailure(user);
      return res.status(400).json({ success: false, message: 'Invalid verification code!' });
    }

    if (!user.resetOtpExpires || user.resetOtpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Request a new one.' });
    }

    user.resetOtpAttempts = 0;
    await user.save();

    return res.status(200).json({ success: true, message: 'Code verified successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to verify code.' });
  }
};

// Forgot Password - Step 3: Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, phone, newPassword, code } = req.body;

    if (!newPassword || !code) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields!' });
    }

    let user = null;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else if (phone) {
      user = await findUserByPhone(User, phone);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }

    if ((user.resetOtpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Request a new verification code.',
      });
    }

    if (!otpIsValid(user, code)) {
      await registerOtpFailure(user);
      return res.status(400).json({ success: false, message: 'Invalid verification code!' });
    }

    if (!user.resetOtpExpires || user.resetOtpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Request a new one.' });
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.ok) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordChangedAt = new Date();
    user.resetOtp = '';
    user.resetOtpExpires = null;
    user.resetOtpAttempts = 0;
    await user.save();

    await logUserActivity({
      userId: user.id,
      action: 'password_change',
      description: 'Password reset via email OTP.',
    });

    return res.status(200).json({ success: true, message: 'Your password has been changed successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

// Get All Users (Admin Only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('id firstName lastName email phone address role avatar isActive lastLoginAt createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const userIds = users.map((u) => u.id);

    const orderStats = await Order.aggregate([
      { $match: { userId: { $in: userIds } } },
      {
        $group: {
          _id: '$userId',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: { $toDouble: '$amount' } },
        },
      },
    ]);

    const statsByUser = Object.fromEntries(
      orderStats.map((row) => [row._id, { orderCount: row.orderCount, totalSpent: row.totalSpent }])
    );

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => {
        const stats = statsByUser[u.id] || { orderCount: 0, totalSpent: 0 };
        return {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phone: u.phone,
          address: u.address,
          role: u.role,
          avatar: u.avatar,
          isActive: u.isActive !== false,
          orderCount: stats.orderCount,
          totalSpent: stats.totalSpent,
          lastLoginAt: u.lastLoginAt || null,
          joinedDate: u.createdAt
            ? new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : 'May 20, 2026',
        };
      }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch registered users.' });
  }
};

// Get User Details + Activity (Admin Only)
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found!' });
    }

    const [activities, recentOrders, totalOrders, spentAgg] = await Promise.all([
      UserActivity.find({ userId: user.id }).sort({ createdAt: -1 }).limit(25),
      Order.find({ userId: user.id }).sort({ createdAt: -1 }).limit(5),
      Order.countDocuments({ userId: user.id }),
      Order.aggregate([
        { $match: { userId: user.id } },
        { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } },
      ]),
    ]);

    const totalSpent = spentAgg[0]?.total || 0;

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address || '',
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive !== false,
        lastLoginAt: user.lastLoginAt || null,
        joinedDate: user.createdAt
          ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          : '',
      },
      stats: {
        totalOrders,
        totalSpent,
      },
      activities: activities.map((a) => ({
        id: a.id,
        action: a.action,
        description: a.description,
        metadata: a.metadata || {},
        createdAt: a.createdAt,
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        product: o.product,
        amount: o.amount,
        status: o.status,
        payment: o.payment,
        date: o.date,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user details.' });
  }
};

// Update User (Admin Only)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found!' });
    }

    if (user.email.toLowerCase() === 'admin@gmail.com' && req.body.role && req.body.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'The main admin account role cannot be changed!' });
    }

    const prevRole = user.role;
    const prevActive = user.isActive !== false;

    const { firstName, lastName, email, phone, role, isActive } = req.body;

    if (firstName !== undefined) user.firstName = String(firstName).trim();
    if (lastName !== undefined) user.lastName = String(lastName).trim();

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const emailExists = await User.findOne({ email: normalizedEmail });
      if (emailExists && emailExists.id !== user.id) {
        return res.status(400).json({ success: false, message: 'This email is already registered to another account!' });
      }
      user.email = normalizedEmail;
    }

    if (phone !== undefined) {
      const normalizedPhone = String(phone).trim();
      const phoneExists = await User.findOne({ phone: normalizedPhone });
      if (phoneExists && phoneExists.id !== user.id) {
        return res.status(400).json({ success: false, message: 'This phone number is already registered to another account!' });
      }
      user.phone = normalizedPhone;
    }

    if (role !== undefined) {
      const allowedRoles = ['user', 'admin', 'delivery'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role specified!' });
      }
      if (user.email.toLowerCase() === 'admin@gmail.com' && role !== 'admin') {
        return res.status(400).json({ success: false, message: 'The main admin account role cannot be changed!' });
      }
      user.role = role;
    }

    if (isActive !== undefined) {
      if (user.email.toLowerCase() === 'admin@gmail.com' && isActive === false) {
        return res.status(400).json({ success: false, message: 'The main admin account cannot be deactivated!' });
      }
      user.isActive = Boolean(isActive);
    }

    await user.save();

    if (role !== undefined && prevRole !== user.role) {
      await logUserActivity({
        userId: user.id,
        action: 'role_changed',
        description: `Role changed from ${prevRole} to ${user.role}.`,
        metadata: { from: prevRole, to: user.role, byAdmin: req.user?.id },
      });
    }

    const nowActive = user.isActive !== false;
    if (isActive !== undefined && prevActive !== nowActive) {
      await logUserActivity({
        userId: user.id,
        action: nowActive ? 'account_activated' : 'account_deactivated',
        description: nowActive ? 'Account activated by admin.' : 'Account deactivated by admin.',
        metadata: { byAdmin: req.user?.id },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User account updated successfully!',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive !== false,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update user account.' });
  }
};

// Delete User (Admin Only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found!' });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'The main admin account cannot be deleted!' });
    }

    await User.deleteOne({ id: req.params.id });
    return res.status(200).json({ success: true, message: 'User account deleted successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
};
