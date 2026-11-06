import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AlertCircle, RotateCcw } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { AppButton } from './AppButton';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Failed to load health information.',
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <AlertCircle size={28} color={colors.error} />
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <AppButton
          title="Try Again"
          onPress={onRetry}
          variant="outline"
          icon={<RotateCcw size={16} color={colors.primary} />}
          style={styles.retryBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginVertical: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: '#B91C1C',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  retryBtn: {
    minWidth: 140,
    backgroundColor: colors.surface,
  },
});

