import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Table from '../models/Table.js';
import MenuItem from '../models/MenuItem.js';
import BillingGroup from '../models/BillingGroup.js';
import connectDB from '../config/db.js';
import { generateQRCode, generateQRCodeString } from '../services/qrCodeService.js';

dotenv.config();

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    // Create admin user if it doesn't exist
    let admin = await User.findOne({ email: 'admin@gmail.com' });
    if (!admin) {
      admin = await User.create({
        email: 'admin@gmail.com',
        password: 'admin123',
        name: 'Admin',
        isAdmin: true,
        isBarista: true,
      });
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create barista user if it doesn't exist
    let barista = await User.findOne({ email: 'barista@espro.com' });
    if (!barista) {
      barista = await User.create({
        email: 'barista@espro.com',
        password: 'barista123',
        name: 'Barista',
        isBarista: true,
      });
      console.log('✅ Barista user created');
    } else {
      console.log('ℹ️  Barista user already exists');
    }

    // Create sample tables
    const tablesCount = await Table.countDocuments();
    if (tablesCount === 0) {
      const tables = [
        { tableNumber: 'Table 1', location: 'Indoor' },
        { tableNumber: 'Table 2', location: 'Indoor' },
        { tableNumber: 'Table 3', location: 'Outdoor' },
        { tableNumber: 'Table 4', location: 'Outdoor' },
        { tableNumber: 'Table 5', location: 'Indoor' },
      ];

      for (const tableData of tables) {
        const qrCode = generateQRCodeString();
        const table = await Table.create({
          ...tableData,
          qrCode,
        });

        // Generate QR code image
        const frontendUrl = process.env.SELF_ORDER_URL || process.env.FRONTEND_URL || 'http://localhost:8084';
        const qrCodeData = await generateQRCode(
          table._id.toString(),
          qrCode,
          tableData.tableNumber,
          frontendUrl,
          null // No Bitly link in seed data
        );
        table.qrCodeUrl = qrCodeData.qrCodeUrl;
        await table.save();
      }
      console.log('✅ Sample tables created');
    } else {
      console.log('ℹ️  Tables already exist');
    }

    // Create sample menu items
    const menuCount = await MenuItem.countDocuments();
    if (menuCount === 0) {
      const menuItems = [
        {
          name: 'Espresso',
          description: 'Classic espresso shot',
          category: 'Beverages',
          price: 120,
          isAvailable: true,
        },
        {
          name: 'Cappuccino',
          description: 'Espresso with steamed milk and foam',
          category: 'Beverages',
          price: 150,
          isAvailable: true,
        },
        {
          name: 'Latte',
          description: 'Espresso with steamed milk',
          category: 'Beverages',
          price: 160,
          isAvailable: true,
        },
        {
          name: 'Americano',
          description: 'Espresso with hot water',
          category: 'Beverages',
          price: 130,
          isAvailable: true,
        },
        {
          name: 'Croissant',
          description: 'Buttery French croissant',
          category: 'Food',
          price: 80,
          isAvailable: true,
        },
        {
          name: 'Sandwich',
          description: 'Ham and cheese sandwich',
          category: 'Food',
          price: 200,
          isAvailable: true,
        },
        {
          name: 'Chocolate Cake',
          description: 'Rich chocolate cake slice',
          category: 'Desserts',
          price: 180,
          isAvailable: true,
        },
      ];

      await MenuItem.insertMany(menuItems);
      console.log('✅ Sample menu items created');
    } else {
      console.log('ℹ️  Menu items already exist');
    }

    console.log('\n✅ Seed data completed successfully!');
    console.log('\n📋 Default credentials:');
    console.log('   Admin:');
    console.log('     Email: admin@gmail.com');
    console.log('     Password: admin123');
    console.log('   Barista:');
    console.log('     Email: barista@espro.com');
    console.log('     Password: barista123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
