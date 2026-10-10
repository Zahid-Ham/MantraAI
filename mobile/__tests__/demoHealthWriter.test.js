import {
  generateDemoHealthRecords,
  getDemoClientRecordIds,
  writeDemoHealthData,
  clearDemoHealthData,
} from '../src/health/demoHealthWriter';
import { DEV_HEALTH_WRITE_PERMISSIONS, HEALTH_READ_PERMISSIONS } from '../src/health/healthPermissions';

describe('Demo Health Data Writer (Development Only)', () => {
  describe('DEV_HEALTH_WRITE_PERMISSIONS', () => {
    test('all development write permissions specify accessType = "write"', () => {
      expect(DEV_HEALTH_WRITE_PERMISSIONS.length).toBeGreaterThanOrEqual(5);
      for (const perm of DEV_HEALTH_WRITE_PERMISSIONS) {
        expect(perm.accessType).toBe('write');
      }
    });

    test('production read permissions remain strictly read-only', () => {
      for (const perm of HEALTH_READ_PERMISSIONS) {
        expect(perm.accessType).toBe('read');
      }
    });
  });

  describe('getDemoClientRecordIds', () => {
    test('generates deterministic stable clientRecordIds for a date', () => {
      const ids = getDemoClientRecordIds('2026-10-04');
      expect(ids.steps).toBe('mantraai-demo-steps-2026-10-04');
      expect(ids.calories).toBe('mantraai-demo-calories-2026-10-04');
      expect(ids.exercise).toBe('mantraai-demo-exercise-2026-10-04');
      expect(ids.sleep).toBe('mantraai-demo-sleep-2026-10-04');
      expect(ids.restingHeartRate).toBe('mantraai-demo-rhr-2026-10-04');
    });
  });

  describe('generateDemoHealthRecords', () => {
    test('generates the exact requested synthetic dataset with valid timestamps', () => {
      const targetDate = new Date(2026, 9, 4); // 2026-10-04
      const result = generateDemoHealthRecords(targetDate);

      expect(result.dateString).toBe('2026-10-04');
      expect(result.summary).toEqual({
        steps: 6842,
        active_calories: 412,
        workout_minutes: 32,
        sleep_duration_minutes: 432,
        resting_heart_rate: 68,
      });

      const { records } = result;

      // Steps
      expect(records.stepsRecord.recordType).toBe('Steps');
      expect(records.stepsRecord.count).toBe(6842);
      expect(records.stepsRecord.metadata.clientRecordId).toBe('mantraai-demo-steps-2026-10-04');

      // Calories
      expect(records.caloriesRecord.recordType).toBe('ActiveCaloriesBurned');
      expect(records.caloriesRecord.energy).toEqual({ value: 412, unit: 'kilocalories' });
      expect(records.caloriesRecord.metadata.clientRecordId).toBe('mantraai-demo-calories-2026-10-04');

      // Exercise
      expect(records.exerciseRecord.recordType).toBe('ExerciseSession');
      expect(records.exerciseRecord.metadata.clientRecordId).toBe('mantraai-demo-exercise-2026-10-04');
      const exDuration = (new Date(records.exerciseRecord.endTime) - new Date(records.exerciseRecord.startTime)) / (1000 * 60);
      expect(exDuration).toBe(32);

      // Sleep (7h 12m = 432 mins)
      expect(records.sleepRecord.recordType).toBe('SleepSession');
      expect(records.sleepRecord.metadata.clientRecordId).toBe('mantraai-demo-sleep-2026-10-04');
      const sleepDuration = (new Date(records.sleepRecord.endTime) - new Date(records.sleepRecord.startTime)) / (1000 * 60);
      expect(sleepDuration).toBe(432);

      // Resting HR
      expect(records.restingHeartRateRecord.recordType).toBe('RestingHeartRate');
      expect(records.restingHeartRateRecord.beatsPerMinute).toBe(68);
      expect(records.restingHeartRateRecord.metadata.clientRecordId).toBe('mantraai-demo-rhr-2026-10-04');
    });

    test('throws error for invalid date input', () => {
      expect(() => generateDemoHealthRecords('invalid-date-string')).toThrow();
    });
  });

  describe('writeDemoHealthData & clearDemoHealthData simulation', () => {
    test('clearDemoHealthData completes safely without error in mock/unsupported environments', async () => {
      const res = await clearDemoHealthData('2026-10-04');
      expect(res.success).toBe(true);
      expect(res.clearedDate).toBe('2026-10-04');
    });

    test('writeDemoHealthData returns structured status in mock environment', async () => {
      const res = await writeDemoHealthData('2026-10-04');
      expect(res.date).toBe('2026-10-04');
      expect(res.summary.steps).toBe(6842);
      expect(res.summary.resting_heart_rate).toBe(68);
    });
  });
});
