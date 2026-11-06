import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

export interface AppCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  categoryColor?: string;
  variant?: 'default' | 'mint' | 'elevated' | 'outlined';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  headerRight?: React.ReactNode;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  title,
  subtitle,
  icon,
  iconBgColor,
  categoryColor,
  variant = 'default',
  onPress,
  style,
  headerRight,
}) => {
  const getCardStyle = (): ViewStyle => {
    switch (variant) {
      case 'mint':
        return {
          backgroundColor: colors.secondary,
          borderColor: '#C6E3D1',
          borderWidth: 1,
        };
      case 'elevated':
        return {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          borderWidth: 1,
          ...shadows.elevated,
        };
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderColor: categoryColor || colors.borderSubtle,
          borderWidth: 1.5,
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          borderWidth: 1,
          ...shadows.card,
        };
    }
  };

  const Content = (
    <View style={[styles.card, getCardStyle(), style]}>
      {(title || icon) && (
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {icon && (
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: iconBgColor || colors.secondary },
                ]}
              >
                {icon}
              </View>
            )}
            <View style={styles.titleWrapper}>
              {title && <Text style={styles.title}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>
          {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
        </View>
      )}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: 16,
    marginVertical: 6,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    marginLeft: 8,
  },
});

