import { Platform, ViewStyle } from 'react-native';
import { colors } from './colors';

export const shadows = {
  none: {},
  subtle: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
    },
    android: {
      elevation: 1,
    },
    default: {},
  }),
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  elevated: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.09,
      shadowRadius: 16,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  modal: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
} as const;

