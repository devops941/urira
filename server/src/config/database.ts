import mongoose from 'mongoose';
import { ENV } from './env.js';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('✅ Connected successfully to MongoDB Atlas (uyira_app)');
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log('MongoDB connection closed.');
};

