import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Clock, RotateCcw, CheckCircle2 } from 'lucide-react-native';
import { AuthLayout } from '../../features/auth/components/AuthLayout';
import { OtpInput } from '../../components/common/OtpInput';
import { AppButton } from '../../components/common/AppButton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { authApiService } from '../../features/auth/services/authService';
import { extractApiErrorMessage } from '../../services/api/apiErrorHandler';
import { colors } from '../../theme/colors';

export default function VerifyRegistrationOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    userId?: string;
    recipient?: string;
    channel?: string;
  }>();

  const userId = params.userId || '';
  const recipient = params.recipient || '+91 98765 43210';

  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(48);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setApiError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setApiError(null);
    setSuccessNotice(null);

    try {
      await authApiService.verifyRegistrationOtp({ userId, otp });
      setSuccessNotice('Account successfully verified! Redirecting to login...');
      setTimeout(() => {
        router.replace({
          pathname: '/(auth)/login',
          params: { verified: 'true' },
        });
      }, 1000);
    } catch (err) {
      const msg = extractApiErrorMessage(err, 'Verification failed. Please check the code.');
      setApiError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    setApiError(null);
    setSuccessNotice(null);

    try {
      const res = await authApiService.resendRegistrationOtp(userId);
      setCountdown(res.nextResendAllowedIn || 60);
      setSuccessNotice('A new verification code has been dispatched.');
    } catch (err) {
      const msg = extractApiErrorMessage(err, 'Failed to resend code. Please try again.');
      setApiError(msg);
    } finally {
      setIsResending(false);
    }
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const formattedCountdown = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <AuthLayout showBack onBackPress={() => router.replace('/(auth)/register')}>
      {/* Center Illustration Matching Design */}
      <AuthLayout.Illustration
        source={require('../../../assets/images/illustration_verify_account.png')}
        size={135}
      />

      <AuthLayout.Title>Verify Your Account</AuthLayout.Title>
      <AuthLayout.Subtitle>
        Enter the 6-digit verification code sent to {recipient}
      </AuthLayout.Subtitle>

      <ErrorMessage message={apiError} />

      {successNotice && (
        <View style={styles.successBanner}>
          <CheckCircle2 size={16} color={colors.success} />
          <Text style={styles.successText}>{successNotice}</Text>
        </View>
      )}

      <AuthLayout.Content>
        {/* 6 Individual Rounded Slots */}
        <OtpInput value={otp} onChange={setOtp} length={6} />

        {/* Resend Countdown Row */}
        {countdown > 0 ? (
          <View style={styles.countdownRow}>
            <Clock size={15} color={colors.textSecondary} />
            <Text style={styles.countdownText}>
              Resend code in <Text style={styles.countdownBold}>{formattedCountdown}</Text>
            </Text>
          </View>
        ) : null}

        {/* Verify Button */}
        <AppButton
          title="Verify"
          variant="primary"
          loading={isVerifying}
          disabled={otp.length !== 6 || isVerifying}
          onPress={handleVerify}
          style={styles.verifyBtn}
        />

        {/* Resend OTP Outline Button */}
        <AppButton
          title="Resend OTP"
          variant="outline"
          loading={isResending}
          disabled={countdown > 0 || isResending}
          onPress={handleResend}
          icon={<RotateCcw size={16} color={colors.primary} />}
          style={styles.resendBtn}
        />
      </AuthLayout.Content>

      <AuthLayout.Footer>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/register')}
          style={styles.changeContactBtn}
        >
          <Text style={styles.changeContactText}>Change Email Address</Text>
        </TouchableOpacity>
      </AuthLayout.Footer>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBackground,
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 14,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 12,
  },
  countdownText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  countdownBold: {
    color: colors.primary,
    fontWeight: '700',
  },
  verifyBtn: {
    width: '100%',
    marginTop: 8,
    marginBottom: 10,
  },
  resendBtn: {
    width: '100%',
  },
  changeContactBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changeContactText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
