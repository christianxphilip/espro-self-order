import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Settings from '../models/Settings.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedSettings = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    const existingSettings = await Settings.findOne();
    
    if (existingSettings) {
      console.log('Settings already exist. Skipping seed.');
      process.exit(0);
    }

    const settings = await Settings.create({
      websocketEnabled: process.env.ENABLE_WEBSOCKET === 'true',
      pollingEnabled: true,
      pollingInterval: parseInt(process.env.POLLING_INTERVAL) || 3000,
    });

    console.log('✅ Settings created successfully!');
    console.log('WebSocket Enabled:', settings.websocketEnabled);
    console.log('Polling Enabled:', settings.pollingEnabled);
    console.log('Polling Interval:', settings.pollingInterval, 'ms');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding settings:', error);
    process.exit(1);
  }
};

seedSettings();
