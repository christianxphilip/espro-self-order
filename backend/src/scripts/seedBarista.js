import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedBarista = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    // Check if barista already exists
    const existingBarista = await User.findOne({ email: 'barista@espro.com' });
    
    if (existingBarista) {
      console.log('Barista user already exists. Skipping seed.');
      process.exit(0);
    }

    // Create barista user
    const barista = await User.create({
      email: 'barista@espro.com',
      password: 'barista123',
      name: 'Barista',
      isBarista: true,
    });

    console.log('✅ Barista user created successfully!');
    console.log('Email: barista@espro.com');
    console.log('Password: barista123');
    console.log('User ID:', barista._id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding barista user:', error);
    process.exit(1);
  }
};

seedBarista();
