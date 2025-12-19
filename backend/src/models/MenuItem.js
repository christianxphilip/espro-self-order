import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  preparationTime: {
    type: Number,
    default: 10, // minutes
    min: 0,
  },
  allergens: [{
    type: String,
    trim: true,
  }],
  dietaryInfo: [{
    type: String,
    trim: true,
  }],
  // Temperature options: 'hot', 'iced', 'iced-only', 'both' (hot and iced)
  temperatureOption: {
    type: String,
    enum: ['hot', 'iced', 'iced-only', 'both'],
    default: 'hot',
  },
  // Whether this item can have extra espresso shot (+30 pesos)
  allowExtraEspresso: {
    type: Boolean,
    default: false,
  },
  // Whether this item can have oat milk substitute (+40 pesos)
  allowOatMilk: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ isAvailable: 1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
