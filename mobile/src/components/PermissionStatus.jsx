import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PERMISSION_METRIC_CONFIGS } from '../health/healthPermissions';

/**
 * PermissionStatus
 * 
 * Displays individual Health Connect permission statuses with clear indicators.
 */
export default function PermissionStatus({
  permissionsMap = {},
  onManagePermissions = null,
  showManageButton = true,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Health Data Permissions</Text>
        {showManageButton && onManagePermissions ? (
          <TouchableOpacity
            style={styles.manageButton}
            onPress={onManagePermissions}
            activeOpacity={0.7}
          >
            <Text style={styles.manageButtonText}>Manage</Text>
            <Ionicons name="open-outline" size={13} color="#2D5A43" style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.list}>
        {PERMISSION_METRIC_CONFIGS.map((item) => {
          const isAllowed = Boolean(permissionsMap[item.recordType]);

          return (
            <View key={item.key} style={styles.row}>
              <View style={styles.leftCol}>
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={isAllowed ? '#2D5A43' : '#8C9A93'}
                  style={styles.itemIcon}
                />
                <View>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.badge,
                  isAllowed ? styles.badgeAllowed : styles.badgeNotAllowed,
                ]}
              >
                <Ionicons
                  name={isAllowed ? 'checkmark' : 'close'}
                  size={12}
                  color={isAllowed ? '#1B4D3E' : '#718096'}
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={[
                    styles.badgeText,
                    isAllowed ? styles.badgeTextAllowed : styles.badgeTextNotAllowed,
                  ]}
                >
                  {isAllowed ? 'Allowed' : 'Not allowed'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2E26',
    letterSpacing: -0.2,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#EBF2EE',
  },
  manageButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D5A43',
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  itemIcon: {
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3748',
  },
  itemDesc: {
    fontSize: 11,
    color: '#718096',
    marginTop: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeAllowed: {
    backgroundColor: '#E8F5E9',
  },
  badgeNotAllowed: {
    backgroundColor: '#F1F3F5',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextAllowed: {
    color: '#1B4D3E',
  },
  badgeTextNotAllowed: {
    color: '#718096',
  },
});
