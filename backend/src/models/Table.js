import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: [true, 'Table number is required'],
    unique: true,
    trim: true,
  },
  qrCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  qrCodeUrl: {
    type: String,
    trim: true,
  },
  bitlyLink: {
    type: String,
    trim: true,
  },
  bitlyId: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  location: {
    type: String,
    trim: true,
  },
  billingGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BillingGroup',
    default: null,
  },
  customRedirectEnabled: {
    type: Boolean,
    default: false,
  },
  customRedirectUrl: {
    type: String,
    trim: true,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes
tableSchema.index({ qrCode: 1 });
tableSchema.index({ isActive: 1 });
tableSchema.index({ billingGroupId: 1 });

const Table = mongoose.model('Table', tableSchema);

export default Table;
