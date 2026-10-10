import {
  normalizeDailyHealthData,
  normalizeSteps,
  normalizeSleepMinutes,
  normalizeExerciseMinutes,
  normalizeRestingHeartRate,
  normalizeActiveCalories,
  formatLocalDateString,
  getDayTimeRange,
} from '../src/health/healthNormalizer';

describe('Health Data Normalizer', () => {
  describe('formatLocalDateString & getDayTimeRange', () => {
    test('formats a Date to YYYY-MM-DD', () => {
      const d = new Date(2026, 9, 4); // Oct 4 2026
      expect(formatLocalDateString(d)).toBe('2026-10-04');
    });

    test('getDayTimeRange computes full day boundary from 00:00 to 23:59:59.999', () => {
      const d = new Date(2026, 9, 4);
      const range = getDayTimeRange(d);
      expect(range.dateString).toBe('2026-10-04');
      expect(new Date(range.startTime).getHours()).toBe(0);
      expect(new Date(range.startTime).getMinutes()).toBe(0);
      expect(new Date(range.endTime).getHours()).toBe(23);
      expect(new Date(range.endTime).getMinutes()).toBe(59);
    });
  });

  describe('normalizeSteps', () => {
    test('normalizes raw number', () => {
      expect(normalizeSteps(5320)).toBe(5320);
    });

    test('normalizes array of step records', () => {
      const records = [{ count: 1200 }, { count: 3120 }, { count: 1000 }];
      expect(normalizeSteps(records)).toBe(5320);
    });

    test('preserves null for missing/empty steps without converting to 0', () => {
      expect(normalizeSteps(null)).toBeNull();
      expect(normalizeSteps(undefined)).toBeNull();
      expect(normalizeSteps([])).toBeNull();
    });
  });

  describe('normalizeSleepMinutes', () => {
    test('normalizes raw number in minutes', () => {
      expect(normalizeSleepMinutes(420)).toBe(420);
    });

    test('normalizes array of sleep sessions with start and end ISO strings', () => {
      const sessions = [
        {
          startTime: '2026-10-04T00:00:00.000Z',
          endTime: '2026-10-04T07:00:00.000Z', // 7 hours = 420 mins
        },
      ];
      expect(normalizeSleepMinutes(sessions)).toBe(420);
    });

    test('preserves null when sleep is missing', () => {
      expect(normalizeSleepMinutes(null)).toBeNull();
      expect(normalizeSleepMinutes(undefined)).toBeNull();
      expect(normalizeSleepMinutes([])).toBeNull();
    });
  });

  describe('normalizeExerciseMinutes', () => {
    test('normalizes exercise sessions', () => {
      const sessions = [
        {
          startTime: '2026-10-04T08:00:00.000Z',
          endTime: '2026-10-04T08:30:00.000Z', // 30 mins
        },
      ];
      const res = normalizeExerciseMinutes(sessions);
      expect(res.active_minutes).toBe(30);
      expect(res.workout_minutes).toBe(30);
    });

    test('preserves null for missing exercise', () => {
      const res = normalizeExerciseMinutes(null);
      expect(res.active_minutes).toBeNull();
      expect(res.workout_minutes).toBeNull();
    });
  });

  describe('normalizeRestingHeartRate', () => {
    test('normalizes single number and array average', () => {
      expect(normalizeRestingHeartRate(68)).toBe(68);
      const records = [{ beatsPerMinute: 66 }, { beatsPerMinute: 70 }];
      expect(normalizeRestingHeartRate(records)).toBe(68);
    });

    test('preserves null for missing resting heart rate', () => {
      expect(normalizeRestingHeartRate(null)).toBeNull();
      expect(normalizeRestingHeartRate(undefined)).toBeNull();
      expect(normalizeRestingHeartRate([])).toBeNull();
    });
  });

  describe('normalizeActiveCalories', () => {
    test('normalizes number and Health Connect energy objects', () => {
      expect(normalizeActiveCalories(450)).toBe(450);
      const records = [
        { energy: { inKilocalories: 250 } },
        { energy: { inKilocalories: 150 } },
      ];
      expect(normalizeActiveCalories(records)).toBe(400);
    });

    test('preserves null for missing calories', () => {
      expect(normalizeActiveCalories(null)).toBeNull();
      expect(normalizeActiveCalories(undefined)).toBeNull();
      expect(normalizeActiveCalories([])).toBeNull();
    });
  });

  describe('normalizeDailyHealthData complete & partial fixtures', () => {
    test('produces canonical schema with complete data', () => {
      const raw = {
        date: new Date(2026, 9, 4),
        steps: 5320,
        active_minutes: 31,
        workout_minutes: 20,
        sleep: 421,
        restingHeartRate: 68,
        activeCalories: 412,
      };
      const result = normalizeDailyHealthData(raw);

      expect(result).toEqual({
        source: 'health_connect',
        date: '2026-10-04',
        steps: 5320,
        active_minutes: 31,
        workout_minutes: 20,
        sleep_duration_minutes: 421,
        resting_heart_rate: 68,
        active_calories: 412,
      });
    });

    test('strictly preserves nulls when metrics are missing (no zero coercion)', () => {
      const partialRaw = {
        date: '2026-10-04',
        steps: 5320,
        sleep: 421,
        activeCalories: 412,
      };
      const result = normalizeDailyHealthData(partialRaw);

      expect(result.steps).toBe(5320);
      expect(result.active_minutes).toBeNull();
      expect(result.workout_minutes).toBeNull();
      expect(result.sleep_duration_minutes).toBe(421);
      expect(result.resting_heart_rate).toBeNull();
      expect(result.active_calories).toBe(412);
    });
  });
});
