import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Line, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Calendar } from 'lucide-react-native';
import { BmiResultDto } from '../../../types/health';
import { colors } from '../../../theme/colors';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48; // padding 24 each side
const CHART_HEIGHT = 160;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 26;
const PADDING_HORIZONTAL = 28;

export interface BmiTrendChartProps {
  records: BmiResultDto[];
  onSelectRecord?: (record: BmiResultDto) => void;
}

export const BmiTrendChart: React.FC<BmiTrendChartProps> = ({ records, onSelectRecord }) => {
  // Sort chronologically (oldest first, newest last) and take last 7 records
  const sorted = [...records]
    .sort((a, b) => new Date(a.calculatedAt).getTime() - new Date(b.calculatedAt).getTime())
    .slice(-7);

  const [selectedIndex, setSelectedIndex] = useState<number>(
    sorted.length > 0 ? sorted.length - 1 : 0
  );

  if (sorted.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Trend Data Yet</Text>
        <Text style={styles.emptySubtitle}>
          Calculate your BMI to start tracking your weight and body mass trends over time.
        </Text>
      </View>
    );
  }

  // Calculate BMI scale (clamp between 16 and 32 for standard visual range)
  const allBmis = sorted.map((r) => r.bmiValue);
  const minBmi = Math.min(16, ...allBmis);
  const maxBmi = Math.max(30, ...allBmis);
  const bmiRange = maxBmi - minBmi || 1;

  const innerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const innerWidth = CHART_WIDTH - PADDING_HORIZONTAL * 2;

  // Coordinate mapping
  const points = sorted.map((record, index) => {
    const x =
      sorted.length === 1
        ? CHART_WIDTH / 2
        : PADDING_HORIZONTAL + (index / (sorted.length - 1)) * innerWidth;
    const normalizedY = (record.bmiValue - minBmi) / bmiRange;
    const y = PADDING_TOP + innerHeight - normalizedY * innerHeight;
    return { x, y, record };
  });

  // Build SVG Path
  let linePath = '';
  let areaPath = '';
  if (points.length === 1) {
    linePath = `M ${points[0].x - 30} ${points[0].y} L ${points[0].x + 30} ${points[0].y}`;
  } else {
    linePath = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
    const firstPt = points[0];
    const lastPt = points[points.length - 1];
    areaPath = `${linePath} L ${lastPt.x} ${CHART_HEIGHT - PADDING_BOTTOM} L ${firstPt.x} ${CHART_HEIGHT - PADDING_BOTTOM} Z`;
  }

  // Healthy weight reference lines (BMI 18.5 and 24.9)
  const healthyBottomY =
    PADDING_TOP + innerHeight - ((18.5 - minBmi) / bmiRange) * innerHeight;
  const healthyTopY =
    PADDING_TOP + innerHeight - ((24.9 - minBmi) / bmiRange) * innerHeight;

  const selectedPoint = points[selectedIndex] || points[points.length - 1];
  const selectedRecord = selectedPoint.record;

  return (
    <View style={styles.container}>
      {/* Header Metric Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Selected BMI</Text>
          <View style={styles.valueRow}>
            <Text style={styles.metricValue}>{selectedRecord.bmiValue.toFixed(2)}</Text>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: selectedRecord.categoryColor || '#16A34A' },
              ]}
            >
              <Text style={styles.categoryBadgeText}>{selectedRecord.category}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricItemRight}>
          <Text style={styles.metricLabel}>Weight</Text>
          <Text style={styles.metricValueWeight}>{selectedRecord.weightKg} kg</Text>
        </View>
      </View>

      {/* Selected Timestamp */}
      <View style={styles.selectedDateRow}>
        <Calendar size={13} color="#64748B" style={{ marginRight: 5 }} />
        <Text style={styles.selectedDateText}>
          {new Date(selectedRecord.calculatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* SVG Trend Graph */}
      <View style={styles.svgWrapper}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#16A34A" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#16A34A" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Healthy Weight Benchmark Band */}
          {healthyBottomY > 0 && healthyTopY > 0 && (
            <Rect
              x={PADDING_HORIZONTAL}
              y={Math.min(healthyTopY, healthyBottomY)}
              width={innerWidth}
              height={Math.abs(healthyBottomY - healthyTopY)}
              fill="#E8F3EC"
              opacity={0.6}
              rx={4}
            />
          )}

          {/* Healthy Reference Boundary Line */}
          {healthyBottomY > 0 && (
            <Line
              x1={PADDING_HORIZONTAL}
              y1={healthyBottomY}
              x2={CHART_WIDTH - PADDING_HORIZONTAL}
              y2={healthyBottomY}
              stroke="#A7F3D0"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          )}

          {/* Shaded Area Under Curve */}
          {areaPath !== '' && <Path d={areaPath} fill="url(#gradientArea)" />}

          {/* Main Curve Line */}
          <Path
            d={linePath}
            stroke="#16A34A"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((pt, i) => {
            const isSelected = i === selectedIndex;
            return (
              <Circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={isSelected ? 6 : 4}
                fill={isSelected ? '#12372A' : '#16A34A'}
                stroke="#FFFFFF"
                strokeWidth={isSelected ? 2.5 : 1.5}
              />
            );
          })}
        </Svg>
      </View>

      {/* X-Axis Date Labels with clickable hit points */}
      <View style={styles.xAxisRow}>
        {points.map((pt, i) => {
          const isSelected = i === selectedIndex;
          const label = new Date(pt.record.calculatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          return (
            <TouchableOpacity
              key={i}
              style={styles.xAxisTouch}
              onPress={() => {
                setSelectedIndex(i);
                if (onSelectRecord) onSelectRecord(pt.record);
              }}
            >
              <Text style={[styles.xAxisLabel, isSelected && styles.xAxisLabelSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricItem: {
    flex: 1,
  },
  metricItemRight: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
    marginBottom: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryText,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricValueWeight: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
  },
  selectedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedDateText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  xAxisTouch: {
    paddingVertical: 4,
  },
  xAxisLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  xAxisLabelSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
  },
});
