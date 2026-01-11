const mongoose = require('mongoose');

const workRequestSchema = new mongoose.Schema({
  title: { type: String },
  typeOfWork: { type: String, required: true },
  paymentAmount: { type: Number, required: true },
  requiredCount: { type: Number, default: 1 },
  location: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // assigned when accepted
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  notes: { type: String },
  // Record who responded (worker) and when they responded. Keeps audit of accept/reject actions.
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  respondedAt: { type: Date },
  // Keep a full history of responses and important lifecycle events for the request
  responseHistory: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      action: { type: String }, // 'posted' | 'accept' | 'reject' | etc.
      at: { type: Date }
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('WorkRequest', workRequestSchema);
