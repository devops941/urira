import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  } as TextStyle,
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  } as TextStyle,
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.textPrimary,
  } as TextStyle,
  bodyLarge: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    color: colors.textPrimary,
  } as TextStyle,
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: colors.textSecondary,
  } as TextStyle,
  bodySmall: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: colors.textSecondary,
  } as TextStyle,
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: colors.textMuted,
  } as TextStyle,
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.2,
  } as TextStyle,
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  } as TextStyle,
};

