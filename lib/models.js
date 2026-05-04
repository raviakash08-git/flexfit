import mongoose from 'mongoose';

const authCodeSchema = new mongoose.Schema({
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  used: { type: Boolean, default: false },
});

const membershipHistorySchema = new mongoose.Schema({
  plan: { type: String, required: true },
  durationMonths: { type: Number, required: true, default: 0 },
  durationDays: { type: Number, default: 0 },
  amount: { type: Number, required: true },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date, required: true },
  paidOn: { type: Date, default: Date.now },
});

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  photoFilename: { type: String, default: null },
  pendingPhotoId: { type: mongoose.Schema.Types.ObjectId, default: null },
  plan: { type: String, default: null },
  durationMonths: { type: Number, default: null },
  durationDays: { type: Number, default: 0 },
  amount: { type: Number, default: null },
  startDate: { type: Date, default: null },
  expiryDate: { type: Date, default: null },
  queuedPlan: {
    plan: String, durationMonths: Number,
    durationDays: { type: Number, default: 0 },
    amount: Number, startDate: Date,
  },
  activeness: {
    type: String,
    enum: ['active', 'inactive', 'new', 'rejected'],
    default: 'new',
  },
  membershipHistory: [membershipHistorySchema],
  requestedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  notes: { type: String },
}, { timestamps: true });

export const AuthCode = mongoose.models.AuthCode || mongoose.model('AuthCode', authCodeSchema);
export const Member   = mongoose.models.Member   || mongoose.model('Member', memberSchema);