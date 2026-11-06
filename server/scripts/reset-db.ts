import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load server .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in server/.env');
  process.exit(1);
}

async function resetDatabase() {
  console.log('🔄 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI!);
  console.log('✅ Connected to MongoDB Atlas:', mongoose.connection.name);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database instance not found');
  }

  // Get all existing collections in the database
  const collections = await db.collections();
  console.log(`\n📋 Found ${collections.length} collection(s) in database "${mongoose.connection.name}":`);

  for (const col of collections) {
    const colName = col.collectionName;
    const countBefore = await col.countDocuments();
    const result = await col.deleteMany({});
    console.log(`  🗑️  [${colName}]: Cleared ${result.deletedCount} of ${countBefore} documents.`);
  }

  console.log('\n✨ All collections have been completely emptied and reset.');
  console.log('🚀 Database is now clean and ready for fresh registration and onboarding testing!\n');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB Atlas.');
}

resetDatabase().catch((err) => {
  console.error('❌ Failed to reset database:', err);
  process.exit(1);
});

