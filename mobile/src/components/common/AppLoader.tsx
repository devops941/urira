import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface AppLoaderProps {
  message?: string;
}

export const AppLoader: React.FC<AppLoaderProps> = ({ message }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: 24,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

