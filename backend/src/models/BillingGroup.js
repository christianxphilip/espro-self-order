import mongoose from 'mongoose';

const billingGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Billing name is required'],
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  orderCount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

// Indexes
billingGroupSchema.index({ isActive: 1 });
billingGroupSchema.index({ createdBy: 1 });

// Method to calculate total amount from orders
billingGroupSchema.methods.calculateTotal = async function() {
  const Order = mongoose.model('Order');
  const result = await Order.aggregate([
    { $match: { billingGroupId: this._id } },
    { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
  ]);
  
  if (result.length > 0) {
    this.totalAmount = result[0].total;
    this.orderCount = result[0].count;
  } else {
    this.totalAmount = 0;
    this.orderCount = 0;
  }
  
  await this.save();
  return { totalAmount: this.totalAmount, orderCount: this.orderCount };
};

const BillingGroup = mongoose.model('BillingGroup', billingGroupSchema);

export default BillingGroup;
