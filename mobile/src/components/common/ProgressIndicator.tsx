import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';

export interface ProgressIndicatorProps {
  progress: number; // 0 - 100
  color?: string;
  backgroundColor?: string;
  height?: number;
  label?: string;
  showPercentage?: boolean;
  style?: ViewStyle;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  color = colors.primary,
  backgroundColor = '#E2E8F0',
  height = 8,
  label,
  showPercentage = true,
  style,
}) => {
  // Clamp progress between 0 and 100 for display bar
  const clampedProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));

  return (
    <View style={[styles.container, style]}>
      {(label || showPercentage) && (
        <View style={styles.textRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showPercentage && (
            <Text style={[styles.percentage, { color }]}>
              {Math.round(clampedProgress)}%
            </Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.track,
          { height, backgroundColor, borderRadius: height / 2 },
        ]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: clampedProgress }}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: color,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  percentage: {
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});

