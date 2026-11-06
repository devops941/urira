import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';

interface PasswordPolicyCardProps {
  password: string;
}

export const PasswordPolicyCard: React.FC<PasswordPolicyCardProps> & {
  Item: React.FC<{ label: string; passed: boolean }>;
} = ({ password }) => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Password Requirements</Text>
      <View style={styles.list}>
        <Item label="At least 8 characters" passed={hasMinLength} />
        <Item label="At least one uppercase letter (A-Z)" passed={hasUppercase} />
        <Item label="At least one lowercase letter (a-z)" passed={hasLowercase} />
        <Item label="At least one number (0-9)" passed={hasNumber} />
        <Item label="At least one special character (!@#$%^&*)" passed={hasSpecial} />
      </View>
    </View>
  );
};

const Item: React.FC<{ label: string; passed: boolean }> = ({ label, passed }) => {
  return (
    <View style={styles.itemRow}>
      <View style={[styles.iconBox, passed ? styles.passedBox : styles.failedBox]}>
        {passed ? (
          <Check size={12} color={colors.surface} />
        ) : (
          <X size={12} color={colors.textSecondary} />
        )}
      </View>
      <Text style={[styles.itemText, passed && styles.passedText]}>{label}</Text>
    </View>
  );
};

PasswordPolicyCard.Item = Item;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D4E9DC',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 10,
  },
  list: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passedBox: {
    backgroundColor: colors.primary,
  },
  failedBox: {
    backgroundColor: '#CBD5E1',
  },
  itemText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  passedText: {
    color: colors.primary,
    fontWeight: '600',
  },
});

