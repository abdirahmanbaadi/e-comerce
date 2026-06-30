const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

// Register User
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields!' });
    }

    // Check if user exists by email
    const emailExists = await User.findOne({ where: { email: email.toLowerCase() } });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'This email is already registered!' });
    }

    // Check if user exists by phone
    const phoneExists = await User.findOne({ where: { phone } });
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
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + (lastName || ''))}&background=073D35&color=ffffff&bold=true&size=128`
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token: generateToken(user.id),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'A server error occurred during registration.' });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter email and password!' });
    }

    // Find user by email
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Incorrect email or password!' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // For fallback check if it is the unhashed default password (e.g. 'admin123' or 'customer123')
      // This is helpful to log in seeded users before they update their passwords
      if (user.password === password) {
        // Hash it now to secure it
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
      } else {
        return res.status(400).json({ success: false, message: 'Incorrect email or password!' });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token: generateToken(user.id),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'A server error occurred during login.' });
  }
};

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone, address, avatar } = req.body;
    const user = await User.findByPk(req.user.id);

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
      const phoneExists = await User.findOne({ where: { phone } });
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

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Your profile has been updated successfully!',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: user.avatar
      }
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
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch && user.password !== currentPassword) { // fallback for unhashed seed password
      return res.status(400).json({ success: false, message: 'Incorrect current password!' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long!' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ success: true, message: 'Your password has been changed successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};

// Forgot Password - Step 1: Verify Phone
exports.verifyPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please enter your phone number!' });
    }

    // Find user by phone (simple normalization helper on backend if needed, or matched exactly)
    // We will do a basic search
    let targetUser = await User.findOne({ where: { phone } });
    
    // Fallback: search phone strings that might match after normalization
    if (!targetUser) {
      const allUsers = await User.findAll();
      targetUser = allUsers.find(u => {
        const cleanDB = u.phone.replace(/\D/g, '').replace(/^252|^0/, '');
        const cleanInput = phone.replace(/\D/g, '').replace(/^252|^0/, '');
        return cleanDB === cleanInput && cleanInput !== '';
      });
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'This phone number is not registered!' });
    }

    return res.status(200).json({
      success: true,
      message: 'Phone number verified!',
      email: targetUser.email,
      phone: targetUser.phone,
      code: '123456' // Send mock code back for UI display
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to verify phone number.' });
  }
};

// Forgot Password - Step 3: Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields!' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long!' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ success: true, message: 'Your password has been changed successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

// Get All Users (Admin Only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map(u => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        address: u.address,
        role: u.role,
        avatar: u.avatar,
        joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'May 20, 2026'
      }))
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch registered users.' });
  }
};

// Delete User (Admin Only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found!' });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'The main admin account cannot be deleted!' });
    }

    await user.destroy();
    return res.status(200).json({ success: true, message: 'User account deleted successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
};

