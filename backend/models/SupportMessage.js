const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },
    ticketId: {
      type: String,
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      required: true,
      enum: ['user', 'admin'],
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    messageText: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

supportMessageSchema.pre('validate', function requireContent(next) {
  const hasText = Boolean(this.messageText && this.messageText.trim());
  const hasImage = Boolean(this.imageUrl && this.imageUrl.trim());
  if (!hasText && !hasImage) {
    this.invalidate('messageText', 'Message must include text or an image.');
  }
  next();
});

supportMessageSchema.pre('save', async function assignMessageId(next) {
  if (!this.isNew || this.id != null) {
    return next();
  }

  const latest = await this.constructor.findOne().sort({ id: -1 }).select('id').lean();
  this.id = latest?.id ? latest.id + 1 : 1;
  next();
});

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
