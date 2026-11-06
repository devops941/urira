import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Clock, RotateCcw, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { AuthLayout } from '../../features/auth/components/AuthLayout';
import { OtpInput } from '../../components/common/OtpInput';
import { AppButton } from '../../components/common/AppButton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { authApiService } from '../../features/auth/services/authService';
import { extractApiErrorMessage } from '../../services/api/apiErrorHandler';
import { colors } from '../../theme/colors';

export default function VerifyResetOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    resetSessionId?: string;
    identifier?: string;
  }>();

  const resetSessionId = params.resetSessionId || '';
  const identifier = params.identifier || 'your email or mobile number';

  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(59);
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

    try {
      const response = await authApiService.verifyResetOtp({ resetSessionId, otp });
      router.push({
        pathname: '/(auth)/set-new-password',
        params: {
          resetAuthToken: response.resetAuthToken,
        },
      });
    } catch (err) {
      const msg = extractApiErrorMessage(err, 'Verification failed. The code may be incorrect or expired.');
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
      await authApiService.resendResetOtp(resetSessionId);
      setCountdown(59);
      setSuccessNotice('A new reset code has been dispatched.');
    } catch (err) {
      const msg = extractApiErrorMessage(err, 'Failed to resend reset code.');
      setApiError(msg);
    } finally {
      setIsResending(false);
    }
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const formattedCountdown = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <AuthLayout showBack onBackPress={() => router.replace('/(auth)/forgot-password')}>
      {/* Center Illustration Matching Design */}
      <AuthLayout.Illustration
        source={require('../../../assets/images/illustration_verify_reset.png')}
        size={135}
      />

      <AuthLayout.Title>Verify Reset Code</AuthLayout.Title>
      <AuthLayout.Subtitle>
        Enter the 6-digit code sent to {identifier}
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

        {/* Resend Countdown */}
        {countdown > 0 ? (
          <View style={styles.countdownRow}>
            <Clock size={15} color={colors.textSecondary} />
            <Text style={styles.countdownText}>
              Resend code in <Text style={styles.countdownBold}>{formattedCountdown}</Text>
            </Text>
          </View>
        ) : null}

        {/* Verify OTP Button */}
        <AppButton
          title="Verify OTP"
          variant="primary"
          loading={isVerifying}
          disabled={otp.length !== 6 || isVerifying}
          onPress={handleVerify}
          style={styles.verifyBtn}
        />

        {/* Resend OTP Button */}
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
          onPress={() => router.replace('/(auth)/login')}
          style={styles.backLinkRow}
        >
          <ArrowLeft size={16} color={colors.primary} />
          <Text style={styles.backLinkText}>Back to Login</Text>
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
  backLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
