import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
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
    type: { type: String },
    description: String,
    quantity: Number,
    price: Number,
    isPriceInclGst: Boolean,
    date: Date,
    srNo: Number
  }],
  totalAmount: {
    type: Number,
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

export default mongoose.models.Quotation || mongoose.model('Quotation', quotationSchema); 