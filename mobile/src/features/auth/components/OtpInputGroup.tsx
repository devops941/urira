import React, { createContext, useContext, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { OtpInput } from '../../../components/common/OtpInput';
import { colors } from '../../../theme/colors';

interface OtpContextValue {
  otp: string;
  setOtp: (val: string) => void;
  countdown: number;
  isResending: boolean;
  onResend: () => void;
  error?: string | null;
}

const OtpContext = createContext<OtpContextValue>({
  otp: '',
  setOtp: () => {},
  countdown: 0,
  isResending: false,
  onResend: () => {},
});

interface OtpInputGroupProps {
  children: ReactNode;
  otp: string;
  setOtp: (val: string) => void;
  countdown: number;
  isResending?: boolean;
  onResend: () => void;
  error?: string | null;
  style?: ViewStyle;
}

export const OtpInputGroup: React.FC<OtpInputGroupProps> & {
  Slots: React.FC<{ length?: number }>;
  Timer: React.FC;
  Resend: React.FC<{ label?: string }>;
} = ({
  children,
  otp,
  setOtp,
  countdown,
  isResending = false,
  onResend,
  error,
  style,
}) => {
  return (
    <OtpContext.Provider value={{ otp, setOtp, countdown, isResending, onResend, error }}>
      <View style={[styles.container, style]}>{children}</View>
    </OtpContext.Provider>
  );
};

const Slots: React.FC<{ length?: number }> = ({ length = 6 }) => {
  const { otp, setOtp, error } = useContext(OtpContext);
  return <OtpInput value={otp} onChange={setOtp} length={length} error={error || undefined} />;
};

const Timer: React.FC = () => {
  const { countdown } = useContext(OtpContext);
  if (countdown <= 0) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const formatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <View style={styles.timerRow}>
      <Text style={styles.timerLabel}>Resend code in </Text>
      <Text style={styles.timerTime}>{formatted}</Text>
    </View>
  );
};

const Resend: React.FC<{ label?: string }> = ({ label = 'Resend Code' }) => {
  const { countdown, isResending, onResend } = useContext(OtpContext);
  const canResend = countdown <= 0 && !isResending;

  return (
    <TouchableOpacity
      disabled={!canResend}
      onPress={onResend}
      style={[styles.resendButton, !canResend && styles.disabledResend]}
      accessibilityRole="button"
    >
      <Text style={[styles.resendText, !canResend && styles.disabledResendText]}>
        {isResending ? 'Sending code...' : label}
      </Text>
    </TouchableOpacity>
  );
};

OtpInputGroup.Slots = Slots;
OtpInputGroup.Timer = Timer;
OtpInputGroup.Resend = Resend;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  timerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  timerTime: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  disabledResend: {
    opacity: 0.5,
  },
  disabledResendText: {
    color: colors.textMuted,
  },
});

