import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // WebSocket settings
  websocketEnabled: {
    type: Boolean,
    default: false,
  },
  
  // Polling settings
  pollingEnabled: {
    type: Boolean,
    default: true, // Default to enabled
  },
  pollingInterval: {
    type: Number,
    default: 3000, // Default 3 seconds
    min: 1000, // Minimum 1 second
    max: 60000, // Maximum 60 seconds
  },
  
  // Last updated by
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    // Create default settings
    settings = await this.create({
      websocketEnabled: process.env.ENABLE_WEBSOCKET === 'true',
      pollingEnabled: true,
      pollingInterval: parseInt(process.env.POLLING_INTERVAL) || 3000,
    });
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
