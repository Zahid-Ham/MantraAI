import { healthConnectManager, HEALTH_CONNECT_STATUS } from '../src/health/HealthConnectManager';
import { Platform } from 'react-native';

describe('HealthConnectManager', () => {
  test('handles unlinked native module environment gracefully', async () => {
    const avail = await healthConnectManager.checkHealthConnectAvailability();
    expect(avail).toBeDefined();
    expect(avail.canConnect).toBe(false);
    expect(avail.status).toBe(HEALTH_CONNECT_STATUS.SDK_NOT_LOADED);
  });

  test('handles non-Android platform gracefully', async () => {
    Platform.OS = 'ios';
    const avail = await healthConnectManager.checkHealthConnectAvailability();
    expect(avail).toBeDefined();
    expect(avail.canConnect).toBe(false);
    expect(avail.status).toBe(HEALTH_CONNECT_STATUS.NOT_ANDROID);
    Platform.OS = 'android';
  });

  test('readDailyHealthData returns empty normalized schema without crashing on unsupported platforms', async () => {
    const data = await healthConnectManager.readDailyHealthData('2026-10-04');
    expect(data.source).toBe('health_connect');
    expect(data.date).toBe('2026-10-04');
    expect(data.steps).toBeNull();
    expect(data.sleep_duration_minutes).toBeNull();
  });

  test('readDaysHealthData returns requested count of daily records', async () => {
    const records = await healthConnectManager.readDaysHealthData(7);
    expect(records).toHaveLength(7);
    for (const rec of records) {
      expect(rec.source).toBe('health_connect');
      expect(rec.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
