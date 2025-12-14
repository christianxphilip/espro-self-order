import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists. Skipping seed.');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      email: 'admin@gmail.com',
      password: 'admin123',
      name: 'Admin',
      isAdmin: true,
      isBarista: true, // Admin can also act as barista
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin123');
    console.log('User ID:', admin._id);

    // Create barista user if it doesn't exist
    const existingBarista = await User.findOne({ email: 'barista@espro.com' });
    if (!existingBarista) {
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
    } else {
      console.log('ℹ️  Barista user already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
