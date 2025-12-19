import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'delivered'],
    default: 'pending',
  },
  notes: {
    type: String,
    trim: true,
  },
  // Temperature selection: 'hot' or 'iced'
  temperature: {
    type: String,
    enum: ['hot', 'iced'],
  },
  // Extra espresso shot (+30 pesos)
  extraEspresso: {
    type: Boolean,
    default: false,
  },
  // Oat milk substitute (+40 pesos)
  oatMilk: {
    type: Boolean,
    default: false,
  },
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: false, // Will be generated in pre-save hook
    unique: true,
    trim: true,
    sparse: true, // Allow multiple null values for uniqueness
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true,
  },
  tableNumber: {
    type: String,
    required: true,
  },
  billingGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BillingGroup',
    required: true,
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    minlength: 2,
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending',
  },
  orderType: {
    type: String,
    enum: ['dine-in', 'takeaway'],
    default: 'dine-in',
  },
  preparedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  completedAt: {
    type: Date,
  },
  requestId: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
    trim: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes
orderSchema.index({ tableId: 1 });
orderSchema.index({ billingGroupId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Generate order number before saving (runs before validation)
orderSchema.pre('save', async function(next) {
  // Only generate if this is a new document and orderNumber is not set
  if (!this.isNew || this.orderNumber) {
    return next();
  }
  
  try {
    // Get count of orders for today to generate unique sequence
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    // Count orders with today's date prefix
    const OrderModel = this.constructor;
    const todayOrders = await OrderModel.countDocuments({
      orderNumber: new RegExp(`^ORD-${datePrefix}-`)
    });
    
    let sequence = todayOrders + 1;
    let orderNumber = `ORD-${datePrefix}-${String(sequence).padStart(4, '0')}`;
    
    // Ensure uniqueness by checking if orderNumber already exists
    let existing = await OrderModel.findOne({ orderNumber });
    let attempts = 0;
    while (existing && attempts < 100) {
      sequence++;
      orderNumber = `ORD-${datePrefix}-${String(sequence).padStart(4, '0')}`;
      existing = await OrderModel.findOne({ orderNumber });
      attempts++;
    }
    
    this.orderNumber = orderNumber;
    console.log(`[Order] Generated order number: ${this.orderNumber}`);
    
    next();
  } catch (error) {
    console.error('[Order] Error generating order number:', error);
    next(error);
  }
});

// Update billing group totals after order is saved
orderSchema.post('save', async function() {
  const BillingGroup = mongoose.model('BillingGroup');
  const billingGroup = await BillingGroup.findById(this.billingGroupId);
  if (billingGroup) {
    await billingGroup.calculateTotal();
  }
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
