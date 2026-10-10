import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import healthConnectManager, { HEALTH_CONNECT_STATUS } from '../health/HealthConnectManager';
import { syncHealthData } from '../api/healthApi';
import HealthMetricCard from '../components/HealthMetricCard';
import PermissionStatus from '../components/PermissionStatus';

export default function HealthConnectScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [availability, setAvailability] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState({});
  const [hasPermissions, setHasPermissions] = useState(false);
  
  const [todayMetrics, setTodayMetrics] = useState(null);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  // Initialize and check status
  const checkStatusAndData = useCallback(async () => {
    setLoading(true);
    try {
      const avail = await healthConnectManager.checkHealthConnectAvailability();
      setAvailability(avail);

      if (avail.canConnect) {
        const perms = await healthConnectManager.getPermissions();
        setPermissionStatus(perms.statusMap);
        setHasPermissions(perms.hasAny);

        if (perms.hasAny) {
          const data = await healthConnectManager.readDailyHealthData();
          setTodayMetrics(data);
        }
      }
    } catch (err) {
      console.warn('Error during Health Connect check:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatusAndData();
  }, [checkStatusAndData]);

  // Handle Connect Health Data button
  const handleConnect = async () => {
    if (!availability?.canConnect) {
      if (availability?.status === HEALTH_CONNECT_STATUS.UPDATE_REQUIRED) {
        Alert.alert(
          'Update Required',
          'Google Health Connect requires an update from the Play Store to sync with MantraAI.'
        );
      } else {
        Alert.alert(
          'Health Connect Unavailable',
          availability?.message || 'Android Health Connect is not available on this device.'
        );
      }
      return;
    }

    setConnecting(true);
    try {
      const res = await healthConnectManager.requestPermissions();
      setPermissionStatus(res.statusMap);
      setHasPermissions(res.hasAny);

      if (res.hasAny) {
        const data = await healthConnectManager.readDailyHealthData();
        setTodayMetrics(data);
      } else {
        Alert.alert(
          'Permissions Not Granted',
          'Please grant at least one health permission to allow MantraAI to personalize your goals.'
        );
      }
    } catch (err) {
      Alert.alert('Permission Error', err.message || 'Could not complete permission request.');
    } finally {
      setConnecting(false);
    }
  };

  // Handle Sync to MantraAI backend
  const handleSyncToBackend = async () => {
    if (!todayMetrics) {
      Alert.alert('No Data', 'Please read Health Connect data first before syncing.');
      return;
    }

    setSyncing(true);
    try {
      const result = await syncHealthData(todayMetrics);
      setLastSyncResult({
        success: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        count: result?.synced_count ?? 1,
      });
      Alert.alert(
        'Synced Successfully',
        'Your daily Health Connect metrics were securely synced to MantraAI.'
      );
    } catch (err) {
      Alert.alert(
        'Sync Failed',
        err.message || 'Could not connect to MantraAI backend. Please check network connection.'
      );
    } finally {
      setSyncing(false);
    }
  };

  const formatSleepDuration = (mins) => {
    if (mins === null || mins === undefined) return null;
    const hours = Math.floor(mins / 60);
    const remainder = mins % 60;
    return `${hours}h ${String(remainder).padStart(2, '0')}m`;
  };

  const isConnected = hasPermissions && availability?.canConnect;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Navigation Bar / Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#2D5A43" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Bridge</Text>
          <TouchableOpacity
            style={styles.testLink}
            onPress={() => router.push('/health-test')}
            activeOpacity={0.7}
          >
            <Ionicons name="construct-outline" size={18} color="#2D5A43" />
          </TouchableOpacity>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.heroSection}>
          <Text style={styles.mainTitle}>Connect Your Health Data</Text>
          <Text style={styles.subtitle}>
            Securely connect Android Health Connect to let MantraAI understand your daily activity and wellness patterns.
          </Text>
        </View>

        {/* Health Connect Status Banner */}
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <View style={styles.brandRow}>
              <View style={styles.hcIconCircle}>
                <Ionicons name="fitness" size={20} color="#2D5A43" />
              </View>
              <View>
                <Text style={styles.connectionTitle}>Health Connect</Text>
                <Text style={styles.connectionSubtitle}>
                  {isConnected ? 'Connected & Active' : 'Not connected'}
                </Text>
              </View>
            </View>

            <View style={[styles.statusPill, isConnected ? styles.pillConnected : styles.pillDisconnected]}>
              <View style={[styles.statusDot, isConnected ? styles.dotConnected : styles.dotDisconnected]} />
              <Text style={[styles.statusPillText, isConnected ? styles.pillTextConnected : styles.pillTextDisconnected]}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (!availability?.canConnect && !loading) && styles.disabledButton]}
            onPress={handleConnect}
            disabled={connecting || loading}
            activeOpacity={0.8}
          >
            {connecting || loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons
                  name={isConnected ? 'sync-outline' : 'shield-checkmark-outline'}
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.primaryButtonText}>
                  {isConnected ? 'Update Health Permissions' : 'Connect Health Data'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Supported Data Checklist */}
        <View style={styles.supportedSection}>
          <Text style={styles.sectionHeader}>Supported Health Data</Text>
          <View style={styles.supportedGrid}>
            {[
              { label: 'Steps', icon: 'footsteps-outline' },
              { label: 'Active minutes', icon: 'time-outline' },
              { label: 'Workout activity', icon: 'barbell-outline' },
              { label: 'Sleep duration', icon: 'moon-outline' },
              { label: 'Resting heart rate', icon: 'heart-outline' },
              { label: 'Active calories', icon: 'flame-outline' },
            ].map((item, index) => (
              <View key={index} style={styles.supportedItem}>
                <Ionicons name="checkmark-circle" size={16} color="#2D5A43" style={{ marginRight: 6 }} />
                <Text style={styles.supportedText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Today's Health Data Preview (if permissions granted) */}
        {hasPermissions && todayMetrics && (
          <View style={styles.previewSection}>
            <View style={styles.previewHeaderRow}>
              <Text style={styles.sectionHeader}>Today's Health Data</Text>
              <Text style={styles.sourceTag}>Source: Android Health Connect</Text>
            </View>

            <View style={styles.metricsGrid}>
              <HealthMetricCard
                icon="footsteps-outline"
                label="Steps"
                value={todayMetrics.steps}
                unit="steps"
              />
              <HealthMetricCard
                icon="time-outline"
                label="Active"
                value={todayMetrics.active_minutes}
                unit="min"
              />
              <HealthMetricCard
                icon="barbell-outline"
                label="Workout"
                value={todayMetrics.workout_minutes}
                unit="min"
              />
              <HealthMetricCard
                icon="moon-outline"
                label="Sleep"
                value={todayMetrics.sleep_duration_minutes}
                formattedValue={formatSleepDuration(todayMetrics.sleep_duration_minutes)}
              />
              <HealthMetricCard
                icon="heart-outline"
                label="Resting heart rate"
                value={todayMetrics.resting_heart_rate}
                unit="bpm"
              />
              <HealthMetricCard
                icon="flame-outline"
                label="Active calories"
                value={todayMetrics.active_calories}
                unit="kcal"
              />
            </View>

            {/* Sync to Backend Button */}
            <TouchableOpacity
              style={[styles.syncButton, syncing && styles.disabledButton]}
              onPress={handleSyncToBackend}
              disabled={syncing}
              activeOpacity={0.8}
            >
              {syncing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.syncButtonText}>Sync to MantraAI</Text>
                </>
              )}
            </TouchableOpacity>

            {lastSyncResult && (
              <View style={styles.syncSuccessBanner}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#1B4D3E" style={{ marginRight: 6 }} />
                <Text style={styles.syncSuccessText}>
                  Health data synced successfully at {lastSyncResult.timestamp}.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Detailed Permission Status Section */}
        {hasPermissions && (
          <PermissionStatus
            permissionsMap={permissionStatus}
            onManagePermissions={() => healthConnectManager.openSettings()}
          />
        )}

        {/* Privacy & Scope Disclaimer */}
        <View style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <Ionicons name="shield-outline" size={18} color="#4A7C59" style={{ marginRight: 8 }} />
            <Text style={styles.privacyTitle}>Privacy & Security</Text>
          </View>
          <Text style={styles.privacyBody}>
            Your health data is used only to personalize your MantraAI experience. You control which Health Connect data types you share. Health Connect is currently read-only in MantraAI.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2E26',
  },
  testLink: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF2EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A2E26',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5C6B64',
  },
  connectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 20,
  },
  connectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hcIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EBF2EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  connectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2E26',
  },
  connectionSubtitle: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  pillConnected: {
    backgroundColor: '#E8F5E9',
  },
  pillDisconnected: {
    backgroundColor: '#F1F3F5',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotConnected: {
    backgroundColor: '#2D5A43',
  },
  dotDisconnected: {
    backgroundColor: '#A0AEC0',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pillTextConnected: {
    color: '#1B4D3E',
  },
  pillTextDisconnected: {
    color: '#718096',
  },
  primaryButton: {
    backgroundColor: '#2D5A43',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  supportedSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A2E26',
    marginBottom: 12,
  },
  supportedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  supportedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    paddingVertical: 4,
  },
  supportedText: {
    fontSize: 13,
    color: '#4A5568',
  },
  previewSection: {
    marginBottom: 20,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceTag: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2D5A43',
  },
  metricsGrid: {
    marginBottom: 8,
  },
  syncButton: {
    backgroundColor: '#1E3E2E',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  syncSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  syncSuccessText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1B4D3E',
  },
  privacyCard: {
    backgroundColor: '#F4F7F5',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E9E4',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D5A43',
  },
  privacyBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#5C6B64',
  },
});
