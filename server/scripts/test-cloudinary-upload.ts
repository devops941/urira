import { uploadAvatarToCloudinary } from '../src/utils/cloudinary.js';

async function testUpload() {
  console.log('☁️ Testing Cloudinary upload directly with provided credentials...');

  // Create a minimal 1x1 transparent PNG buffer
  const samplePngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const buffer = Buffer.from(samplePngBase64, 'base64');

  try {
    const result = await uploadAvatarToCloudinary(buffer, 'test_user_123');
    console.log('✅ Cloudinary upload successful!');
    console.log('   Public ID:', result.public_id);
    console.log('   Secure URL:', result.secure_url);
    console.log('   Format:', result.format);
    console.log('   Bytes:', result.bytes);
  } catch (error) {
    console.error('❌ Cloudinary upload failed:', error);
    process.exit(1);
  }
}

testUpload();

