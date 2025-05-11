import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  serialNo: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
  },
  patientName: {
    type: String,
    required: true,
  },
  patientAddress: {
    type: String,
    required: true,
  },
  patientContact: {
    type: String,
    required: true,
  },
  patientAge: {
    type: String,
    required: true,
  },
  patientGender: {
    type: String,
    required: true,
  },
  items: [{
    description: String,
    quantity: Number,
    rate: Number,
    amount: Number,
  }],
  totalAmount: {
    type: Number,
    required: true,
  },
  amountInWords: {
    type: String,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  cgstAmount: {
    type: Number,
    default: 0,
  },
  sgstAmount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Bill || mongoose.model('Bill', billSchema);
