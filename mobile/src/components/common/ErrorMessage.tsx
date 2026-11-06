import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';

interface ErrorMessageProps {
  message: string | null;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <AlertCircle size={18} color={colors.error} style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBackground,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 12,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    flex: 1,
    color: colors.error,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});

