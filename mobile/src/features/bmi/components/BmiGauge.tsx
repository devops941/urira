import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';

export interface BmiGaugeProps {
  bmi: number;
  category: string;
  categoryColor?: string;
}

export const BmiGauge: React.FC<BmiGaugeProps> = ({
  bmi,
  category,
  categoryColor = '#16A34A',
}) => {
  // Clamp BMI for indicator positioning (10 to 40 range)
  const clampedBmi = Math.min(Math.max(bmi, 10), 40);
  const percentage = ((clampedBmi - 10) / 30) * 100;

  return (
    <View style={styles.container}>
      {/* Circular Arc Mockup using Styled Borders */}
      <View style={styles.gaugeContainer}>
        <View style={[styles.arcCircle, { borderColor: categoryColor }]}>
          <View style={styles.arcInnerContent}>
            <Text style={styles.bmiValueText}>{bmi > 0 ? bmi.toFixed(2) : '--'}</Text>
            <Text style={styles.bmiLabelText}>BMI</Text>
          </View>
        </View>
      </View>

      {/* Category Capsule Badge */}
      <View style={[styles.categoryPill, { backgroundColor: categoryColor }]}>
        <Text style={styles.categoryPillText}>{category || 'Healthy Weight'}</Text>
      </View>

      {/* Segmented Range Bar with Markers */}
      <View style={styles.rangeSection}>
        <View style={styles.rangeBar}>
          <View style={[styles.rangeSegment, { backgroundColor: '#38BDF8', flex: 18.5 }]} />
          <View style={[styles.rangeSegment, { backgroundColor: '#22C55E', flex: 6.4 }]} />
          <View style={[styles.rangeSegment, { backgroundColor: '#FB923C', flex: 5 }]} />
          <View style={[styles.rangeSegment, { backgroundColor: '#EF4444', flex: 10 }]} />
        </View>

        {/* Marker Indicator Pin */}
        <View style={[styles.markerPin, { left: `${Math.min(Math.max(percentage, 2), 96)}%` }]} />

        {/* Labels underneath the range bar */}
        <View style={styles.rangeLabelsRow}>
          <Text style={styles.rangeLabelText}>&lt; 18.5</Text>
          <Text style={styles.rangeLabelText}>18.5 - 24.9</Text>
          <Text style={styles.rangeLabelText}>25 - 29.9</Text>
          <Text style={styles.rangeLabelText}>&ge; 30</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  arcCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 14,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  arcInnerContent: {
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmiValueText: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: -1,
  },
  bmiLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.secondaryText,
    marginTop: -2,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryPillText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  rangeSection: {
    width: '94%',
    alignItems: 'center',
    position: 'relative',
  },
  rangeBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  rangeSegment: {
    height: '100%',
  },
  markerPin: {
    position: 'absolute',
    top: -4,
    width: 6,
    height: 16,
    borderRadius: 3,
    backgroundColor: colors.primaryText,
  },
  rangeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  rangeLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryText,
  },
});
