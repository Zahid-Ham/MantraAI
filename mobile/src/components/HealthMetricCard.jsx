import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * HealthMetricCard
 * 
 * Displays a single health metric following MantraAI calm aesthetic.
 * If value is null/undefined, it explicitly renders "Not available" instead of "0".
 */
export default function HealthMetricCard({
  icon = 'pulse-outline',
  label = 'Metric',
  value = null,
  unit = '',
  formattedValue = null,
  accentColor = '#2D5A43',
}) {
  const isAvailable = value !== null && value !== undefined;

  let displayContent = 'Not available';
  if (formattedValue) {
    displayContent = formattedValue;
  } else if (isAvailable) {
    if (typeof value === 'number') {
      displayContent = value.toLocaleString();
    } else {
      displayContent = String(value);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}15` }]}>
          <Ionicons name={icon} size={18} color={accentColor} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.valueText, !isAvailable && styles.unavailableText]}>
          {displayContent}
        </Text>
        {isAvailable && unit ? (
          <Text style={styles.unitText}>{unit}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 12,
    shadowColor: '#1A2E26',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5C6B64',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A2E26',
  },
  unavailableText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  unitText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#718096',
    marginLeft: 6,
  },
});
