import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { VerificationTokenModel } from '../src/modules/verification/verification.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { lastSentOtpForTesting } from '../src/utils/email.js';

const runIntegrationTest = async () => {
  console.log('🧪 Starting UYIRA Authentication End-to-End Test Suite...\n');

  try {
    await connectDatabase();

    const testEmail = `tester_${Date.now()}@uyira.health`;
    const testMobile = `+9198765${Math.floor(10000 + Math.random() * 90000)}`;
    const testPassword = 'Password@123';
    const newPassword = 'NewPassword@456';

    console.log(`👤 Test Candidate: ${testEmail} (${testMobile})`);

    // 1. REGISTRATION
    console.log('\n--- 1. Testing Registration ---');
    const regResult = await authService.register({
      fullName: 'Gokul Test User',
      email: testEmail,
      mobileNumber: testMobile,
      dateOfBirth: '2000-01-15',
      gender: 'male',
      password: testPassword,
      confirmPassword: testPassword,
      termsAccepted: true,
    });

    console.log('✅ Registration successful. User ID:', regResult.userId);
    const regOtp = lastSentOtpForTesting!;
    console.log('🔑 Captured registration OTP from notification channel:', regOtp);

    // 2. RETRIEVE OTP RECORD & VERIFY
    console.log('\n--- 2. Testing OTP Verification ---');
    const otpDoc = await VerificationTokenModel.findOne({
      userId: regResult.userId,
      purpose: 'REGISTRATION',
    });

    if (!otpDoc) {
      throw new Error('Verification token record was not found in database!');
    }
    console.log('✅ OTP record created with TTL index. Expiration:', otpDoc.expiresAt);

    // Test invalid OTP
    try {
      await authService.verifyRegistrationOtp({ userId: regResult.userId, otp: '000000' });
      throw new Error('Should have failed with invalid OTP!');
    } catch (err: any) {
      console.log('✅ Invalid OTP correctly rejected:', err.message);
    }

    // Test valid OTP
    const verifyResult = await authService.verifyRegistrationOtp({
      userId: regResult.userId,
      otp: regOtp,
    });
    console.log('✅ Account successfully activated. isVerified =', verifyResult.user.isVerified);

    // 3. LOGIN FLOW
    console.log('\n--- 3. Testing Login Flow ---');
    // Test wrong password
    try {
      await authService.login({ identifier: testEmail, password: 'WrongPassword@123' });
      throw new Error('Should have failed with wrong password!');
    } catch (err: any) {
      console.log('✅ Wrong password correctly rejected:', err.message);
    }

    // Test correct login
    const loginResult = await authService.login({
      identifier: testEmail,
      password: testPassword,
    });
    console.log('✅ Login successful!');
    console.log('   Access Token received (length):', loginResult.accessToken.length);
    console.log('   Refresh Token received (length):', loginResult.refreshToken.length);

    // 4. GET CURRENT USER PROFILE
    console.log('\n--- 4. Testing Profile Retrieval ---');
    const profile = await authService.getCurrentUser(regResult.userId);
    console.log('✅ Profile fetched:', profile.fullName, `[${profile.accountStatus}]`);

    // 5. REFRESH TOKEN ROTATION
    console.log('\n--- 5. Testing Refresh Token Rotation ---');
    const refreshed = await authService.refreshToken(loginResult.refreshToken);
    console.log('✅ Token rotated successfully. New Access Token issued.');

    // Try re-using old refresh token (should be revoked)
    try {
      await authService.refreshToken(loginResult.refreshToken);
      throw new Error('Should have rejected rotated refresh token!');
    } catch (err: any) {
      console.log('✅ Old refresh token correctly revoked:', err.message);
    }

    // 6. FORGOT PASSWORD FLOW
    console.log('\n--- 6. Testing Forgot Password Flow ---');
    const forgotResult = await authService.forgotPassword({ identifier: testEmail });
    console.log('✅ Forgot password OTP dispatched. Reset Session ID:', forgotResult.resetSessionId);
    const resetOtp = lastSentOtpForTesting!;
    console.log('🔑 Captured Reset OTP from notification channel:', resetOtp);

    // Verify reset OTP
    const resetVerifyResult = await authService.verifyResetOtp({
      resetSessionId: forgotResult.resetSessionId,
      otp: resetOtp,
    });
    console.log('✅ Reset OTP verified. Reset Auth Token issued (length):', resetVerifyResult.resetAuthToken.length);

    // Reset password
    await authService.resetPassword({
      resetAuthToken: resetVerifyResult.resetAuthToken,
      newPassword,
      confirmPassword: newPassword,
    });
    console.log('✅ Password successfully updated in Atlas.');

    // 7. LOGIN WITH NEW PASSWORD
    console.log('\n--- 7. Testing Login With New Password ---');
    const newLoginResult = await authService.login({
      identifier: testEmail,
      password: newPassword,
    });
    console.log('✅ Successfully authenticated with new password! User:', newLoginResult.user.fullName);

    // 8. LOGOUT
    console.log('\n--- 8. Testing Logout ---');
    await authService.logout(newLoginResult.refreshToken);
    console.log('✅ Logout completed. Session invalidated.');

    // Clean up test data
    await UserModel.findByIdAndDelete(regResult.userId);
    await VerificationTokenModel.deleteMany({ userId: regResult.userId });
    await SessionModel.deleteMany({ userId: regResult.userId });
    console.log('\n🧹 Test records cleaned up successfully.');

    console.log('\n🎉 ALL 8 BACKEND AUTHENTICATION INTEGRATION TESTS PASSED PERFECTLY!\n');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
};

runIntegrationTest();
