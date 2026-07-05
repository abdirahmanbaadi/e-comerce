const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      default: 'Mogadishu, Somalia',
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'user',
      enum: ['user', 'admin', 'delivery'],
      required: true,
    },
    driverApplication: {
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
      },
      district: { type: String, default: '' },
      vehicleType: { type: String, default: '' },
      experience: { type: String, default: '' },
      availability: { type: String, default: '' },
      appliedAt: { type: Date, default: null },
      reviewedAt: { type: Date, default: null },
      rejectReason: { type: String, default: '' },
    },
    avatar: {
      type: String,
      default: '',
    },
    resetOtp: {
      type: String,
      default: '',
    },
    resetOtpExpires: {
      type: Date,
      default: null,
    },
    resetOtpAttempts: {
      type: Number,
      default: 0,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    driverStatus: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'available',
    },
    notificationPreferences: {
      emailAlerts: { type: Boolean, default: true },
      smsAlerts: { type: Boolean, default: false },
      pushAlerts: { type: Boolean, default: false },
      securityEmail: { type: Boolean, default: true },
      securitySms: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.password;
        delete ret.resetOtp;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.password;
        delete ret.resetOtp;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('User', userSchema);
