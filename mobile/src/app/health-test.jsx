import React, { useState, useEffect } from 'react';
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
import { syncHealthData, getTodayGoals } from '../api/healthApi';
import { BASE_URL } from '../services/api';
import { writeDemoHealthData, clearDemoHealthData } from '../health/demoHealthWriter';

export default function HealthTestScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [todayData, setTodayData] = useState(null);
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [demoWriterStatus, setDemoWriterStatus] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Populate Today's Demo Data into Health Connect
  const handlePopulateDemoData = async () => {
    setLoading(true);
    addLog('Populating synthetic demo records into Android Health Connect SDK...');
    try {
      const res = await writeDemoHealthData();
      if (res.success) {
        setDemoWriterStatus({
          written: true,
          date: res.date,
          summary: res.summary,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        addLog(`Demo data written to Health Connect for ${res.date} (${res.insertedCount} records).`);
        Alert.alert('Demo Data Written', 'Synthetic demo records were successfully written to Health Connect.');
      } else {
        addLog(`Demo writer notice: ${res.message}`);
        Alert.alert('Notice', res.message);
      }
    } catch (err) {
      addLog(`Demo write error: ${err.message}`);
      Alert.alert('Write Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Clear Today's Demo Data from Health Connect
  const handleClearDemoData = async () => {
    setLoading(true);
    addLog('Clearing synthetic demo records from Android Health Connect SDK...');
    try {
      const res = await clearDemoHealthData();
      setDemoWriterStatus(null);
      addLog(res.details);
      Alert.alert('Demo Data Cleared', res.details);
    } catch (err) {
      addLog(`Demo clear error: ${err.message}`);
      Alert.alert('Clear Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check Backend connectivity on mount
  const checkBackend = async () => {
    try {
      await getTodayGoals();
      setBackendStatus('Connected');
      addLog(`Backend responded (${BASE_URL})`);
    } catch (e) {
      setBackendStatus(`Disconnected: ${e.message}`);
      addLog(`Backend check warning: ${e.message}`);
    }
  };

  // Check Health Connect availability
  const handleCheckHealthConnect = async () => {
    setLoading(true);
    addLog('Checking Android Health Connect availability...');
    try {
      const avail = await healthConnectManager.checkHealthConnectAvailability();
      setAvailability(avail);
      addLog(`Health Connect status: ${avail.status} (${avail.message})`);

      if (avail.canConnect) {
        const perms = await healthConnectManager.getPermissions();
        setPermissions(perms.statusMap);
        addLog(`Granted permissions count: ${perms.grantedList.length}`);
      }
    } catch (err) {
      addLog(`Check error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Request production read permissions
  const handleRequestPermissions = async () => {
    setLoading(true);
    addLog('Prompting Health Connect read permission dialog...');
    try {
      const res = await healthConnectManager.requestPermissions();
      setPermissions(res.statusMap);
      addLog(`Permission response received. Granted count: ${res.grantedList.length}`);
    } catch (err) {
      addLog(`Permission request error: ${err.message}`);
      Alert.alert('Permission Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Read Today's Data
  const handleReadToday = async () => {
    setLoading(true);
    addLog('Reading today daily aggregates from Health Connect SDK...');
    try {
      const data = await healthConnectManager.readDailyHealthData();
      setTodayData(data);
      addLog(`Read completed for date: ${data.date}. Steps: ${data.steps ?? 'null'}`);
    } catch (err) {
      addLog(`Read error: ${err.message}`);
      Alert.alert('Read Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sync today's data to MantraAI backend
  const handleSyncToday = async () => {
    if (!todayData) {
      Alert.alert('No Data', 'Please read today data first.');
      return;
    }
    setLoading(true);
    addLog(`Sending POST /api/v1/health/sync (Date: ${todayData.date})...`);
    try {
      const res = await syncHealthData(todayData);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(timeStr);
      addLog(`Sync success. Backend synced count: ${res.records_received ?? res.synced_count ?? 1}`);
      Alert.alert('Success', `Synced to MantraAI backend at ${timeStr}`);
    } catch (err) {
      addLog(`Sync failure: ${err.message}`);
      Alert.alert('Sync Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 7-day test mode: Sync Last 7 Days
  const handleSync7Days = async () => {
    setLoading(true);
    addLog('Starting 7-Day Test Mode: reading past 7 days...');
    try {
      const weekData = await healthConnectManager.readDaysHealthData(7);
      addLog(`Read ${weekData.length} daily objects from Health Connect.`);
      
      addLog(`Sending 7-day batch to POST /api/v1/health/sync...`);
      const res = await syncHealthData(weekData);
      
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(timeStr);
      addLog(`7-Day batch sync succeeded! Server synced count: ${res.records_received ?? res.synced_count}`);
      Alert.alert('7-Day Sync Complete', `Successfully synced ${res.records_received ?? res.synced_count} daily records to MantraAI.`);
    } catch (err) {
      addLog(`7-Day Sync failed: ${err.message}`);
      Alert.alert('Batch Sync Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCheckHealthConnect();
    checkBackend();
  }, []);

  const formatMins = (m) => (m !== null && m !== undefined ? `${m} min` : 'Not available');
  const formatSleep = (m) => {
    if (m === null || m === undefined) return 'Not available';
    const hrs = Math.floor(m / 60);
    const rem = m % 60;
    return `${hrs}h ${rem}m`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#2D5A43" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Health Connect Test</Text>
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>Developer Diagnostic</Text>
            </View>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Section 1: Health Connect Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Health Connect Status</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.dot,
                availability?.isAvailable ? styles.dotGreen : styles.dotAmber,
              ]}
            />
            <Text style={styles.statusLabel}>
              {availability ? availability.status.toUpperCase() : 'CHECKING...'}
            </Text>
          </View>
          <Text style={styles.cardSubtitle}>{availability?.message || 'Inspecting device...'}</Text>
        </View>

        {/* Section 2: Permissions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Health Connect Permissions (Read)</Text>
          <View style={styles.permList}>
            {[
              { key: 'Steps', label: 'Steps' },
              { key: 'SleepSession', label: 'Sleep' },
              { key: 'RestingHeartRate', label: 'Resting Heart Rate' },
              { key: 'ExerciseSession', label: 'Exercise / Workouts' },
              { key: 'ActiveCaloriesBurned', label: 'Active Calories' },
            ].map((p) => {
              const granted = Boolean(permissions[p.key]);
              return (
                <View key={p.key} style={styles.permItem}>
                  <View style={[styles.dotSmall, granted ? styles.dotGreen : styles.dotGrey]} />
                  <Text style={styles.permText}>{p.label}</Text>
                  <Text style={[styles.permValue, granted ? styles.textGreen : styles.textGrey]}>
                    {granted ? 'Allowed' : 'Not Allowed'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Section: Developer Test Data Writer */}
        <View style={[styles.card, styles.demoCard]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.demoTitleGroup}>
              <Text style={styles.demoHeaderTitle}>DEVELOPER TEST DATA</Text>
              <Text style={styles.demoSubtitle}>
                Synthetic Health Connect records for integration testing only.
              </Text>
            </View>
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>Synthetic / Dev</Text>
            </View>
          </View>

          <Text style={styles.demoDisclaimer}>
            These records are synthetic and were created only to test the Health Connect integration without a physical smartwatch.
          </Text>

          {demoWriterStatus?.written && (
            <View style={styles.demoSummaryBox}>
              <View style={styles.demoSummaryHeader}>
                <Ionicons name="checkmark-done-circle" size={16} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.demoSummaryTitle}>Demo data written to Health Connect.</Text>
              </View>
              <View style={styles.demoMetricsList}>
                <Text style={styles.demoMetricItem}>• Steps: <Text style={styles.boldText}>6,842</Text></Text>
                <Text style={styles.demoMetricItem}>• Active calories: <Text style={styles.boldText}>412 kcal</Text></Text>
                <Text style={styles.demoMetricItem}>• Exercise: <Text style={styles.boldText}>32 min</Text></Text>
                <Text style={styles.demoMetricItem}>• Sleep: <Text style={styles.boldText}>7h 12m</Text></Text>
                <Text style={styles.demoMetricItem}>• Resting heart rate: <Text style={styles.boldText}>68 bpm</Text></Text>
              </View>
              <Text style={styles.demoSyntheticTag}>Synthetic / Developer Data</Text>
            </View>
          )}

          <View style={styles.demoButtonsRow}>
            <TouchableOpacity
              style={[styles.demoActionBtn, styles.demoPopulateBtn]}
              onPress={handlePopulateDemoData}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.demoBtnText}>Populate Today's Demo Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoActionBtn, styles.demoClearBtn]}
              onPress={handleClearDemoData}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={15} color="#991B1B" style={{ marginRight: 6 }} />
              <Text style={styles.demoClearBtnText}>Clear Today's Demo Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: Today's Data (Read from Health Connect) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>3. Today's Health Data (Read from SDK)</Text>
            {todayData && <Text style={styles.dateBadge}>{todayData.date}</Text>}
          </View>
          {todayData ? (
            <View style={styles.dataGrid}>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>Steps:</Text>
                <Text style={styles.dataVal}>
                  {todayData.steps !== null ? todayData.steps.toLocaleString() : 'Not available'}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>Active:</Text>
                <Text style={styles.dataVal}>{formatMins(todayData.active_minutes)}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>Workout:</Text>
                <Text style={styles.dataVal}>{formatMins(todayData.workout_minutes)}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>Sleep:</Text>
                <Text style={styles.dataVal}>{formatSleep(todayData.sleep_duration_minutes)}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>Resting HR:</Text>
                <Text style={styles.dataVal}>
                  {todayData.resting_heart_rate !== null ? `${todayData.resting_heart_rate} bpm` : 'Not available'}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataKey}>Active Calories:</Text>
                <Text style={styles.dataVal}>
                  {todayData.active_calories !== null ? `${todayData.active_calories} kcal` : 'Not available'}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>No data read yet. Tap "Read Today's Data" below.</Text>
          )}
        </View>

        {/* Section 4: Backend Connection Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>4. MantraAI Backend Status</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.dot,
                backendStatus.startsWith('Connected') ? styles.dotGreen : styles.dotAmber,
              ]}
            />
            <Text style={styles.statusLabel}>{backendStatus}</Text>
          </View>
          <View style={styles.backendDetailRow}>
            <Text style={styles.backendEndpointText}>Target: {BASE_URL}</Text>
            {lastSyncTime && (
              <Text style={styles.lastSyncText}>Last sync: {lastSyncTime}</Text>
            )}
          </View>
        </View>

        {/* Actions Button Grid */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleCheckHealthConnect}
            disabled={loading}
          >
            <Ionicons name="refresh-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Check Health Connect</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleRequestPermissions}
            disabled={loading}
          >
            <Ionicons name="key-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Request Permissions (Read)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleReadToday}
            disabled={loading}
          >
            <Ionicons name="eye-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Read Today's Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.primaryActionBtn]}
            onPress={handleSyncToday}
            disabled={loading}
          >
            <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Sync to MantraAI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.test7DayBtn]}
            onPress={handleSync7Days}
            disabled={loading}
          >
            <Ionicons name="calendar-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Sync Last 7 Days (Dev)</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#2D5A43" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}

        {/* Section 5: Realtime Diagnostic Logs */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>5. Diagnostic Trace Log</Text>
            <TouchableOpacity onPress={() => setLogs([])}>
              <Text style={styles.clearLogsText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.logBox}>
            {logs.length === 0 ? (
              <Text style={styles.logPlaceholder}>No events recorded yet.</Text>
            ) : (
              logs.map((item, idx) => (
                <Text key={idx} style={styles.logLine}>
                  {item}
                </Text>
              ))
            )}
          </View>
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
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2E26',
    textAlign: 'center',
  },
  devBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'center',
    marginTop: 2,
  },
  devBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2E26',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#5C6B64',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  dotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  dotGreen: {
    backgroundColor: '#10B981',
  },
  dotAmber: {
    backgroundColor: '#F59E0B',
  },
  dotGrey: {
    backgroundColor: '#9CA3AF',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A2E26',
  },
  permList: {
    gap: 8,
    marginTop: 4,
  },
  permItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  permText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
  },
  permValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  textGreen: {
    color: '#059669',
  },
  textGrey: {
    color: '#9CA3AF',
  },
  dateBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2D5A43',
    backgroundColor: '#EBF2EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dataGrid: {
    gap: 6,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  dataKey: {
    fontSize: 13,
    color: '#5C6B64',
  },
  dataVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A2E26',
  },
  noDataText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#9CA3AF',
  },
  backendDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  backendEndpointText: {
    fontSize: 11,
    color: '#718096',
  },
  lastSyncText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#2D5A43',
  },
  demoCard: {
    backgroundColor: '#F7FAF8',
    borderColor: '#D2E3D8',
    borderWidth: 1.5,
  },
  demoTitleGroup: {
    flex: 1,
    paddingRight: 8,
  },
  demoHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3E2E',
    letterSpacing: 0.5,
  },
  demoSubtitle: {
    fontSize: 12,
    color: '#4A5D52',
    marginTop: 2,
  },
  demoBadge: {
    backgroundColor: '#E2EFE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2D5A43',
  },
  demoDisclaimer: {
    fontSize: 11,
    color: '#5C6B64',
    lineHeight: 16,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  demoSummaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1E7DD',
    marginBottom: 10,
  },
  demoSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  demoSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  demoMetricsList: {
    gap: 3,
    marginLeft: 4,
    marginBottom: 6,
  },
  demoMetricItem: {
    fontSize: 12,
    color: '#2D3748',
  },
  boldText: {
    fontWeight: '700',
    color: '#1A202C',
  },
  demoSyntheticTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#718096',
    marginTop: 2,
  },
  demoButtonsRow: {
    flexDirection: 'column',
    gap: 8,
  },
  demoActionBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoPopulateBtn: {
    backgroundColor: '#2D5A43',
  },
  demoClearBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  demoBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  demoClearBtnText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
  },
  actionGrid: {
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: '#4A5568',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtn: {
    backgroundColor: '#2D5A43',
  },
  test7DayBtn: {
    backgroundColor: '#1E3E2E',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#2D5A43',
  },
  clearLogsText: {
    fontSize: 11,
    color: '#718096',
  },
  logBox: {
    backgroundColor: '#1A2E26',
    borderRadius: 8,
    padding: 12,
    maxHeight: 180,
  },
  logPlaceholder: {
    fontSize: 11,
    color: '#8C9A93',
    fontStyle: 'italic',
  },
  logLine: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#D1E7DD',
    marginBottom: 4,
  },
});
