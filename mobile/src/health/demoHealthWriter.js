/**
 * MantraAI Development-Only Health Connect Demo Data Writer
 * 
 * IMPORTANT: DEVELOPMENT / TESTING TOOL ONLY.
 * 
 * This module writes deterministic synthetic health records directly into
 * Android Health Connect using official Health Connect insertRecords APIs.
 * 
 * Flow verified:
 * Demo Generator -> Health Connect -> MantraAI Health Reader -> FastAPI -> PostgreSQL
 * 
 * Never used in production or standard user flows.
 */

import { Platform } from 'react-native';
import { DEV_HEALTH_WRITE_PERMISSIONS } from './healthPermissions';
import { formatLocalDateString } from './healthNormalizer';

// Lazy-load Health Connect SDK
let HealthConnectSDK = null;
try {
  HealthConnectSDK = require('react-native-health-connect');
} catch (e) {
  HealthConnectSDK = null;
}

/**
 * Returns deterministic clientRecordIds for a given date.
 * Used for strict idempotency and targeted deletion.
 * 
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {Record<string, string>}
 */
export function getDemoClientRecordIds(dateStr) {
  return {
    steps: `mantraai-demo-steps-${dateStr}`,
    calories: `mantraai-demo-calories-${dateStr}`,
    exercise: `mantraai-demo-exercise-${dateStr}`,
    sleep: `mantraai-demo-sleep-${dateStr}`,
    restingHeartRate: `mantraai-demo-rhr-${dateStr}`,
  };
}

/**
 * Pure generator creating the exact synthetic demo record payload
 * for a target date with valid local timestamps and stable client IDs.
 * 
 * Dataset:
 * - Steps: 6,842
 * - Active calories: 412 kcal
 * - Exercise / workout: 32 min (07:00 -> 07:32)
 * - Sleep duration: 7h 12m (23:00 previous night -> 06:12 morning)
 * - Resting heart rate: 68 bpm (06:30)
 * 
 * @param {Date|string} [targetDate] 
 * @returns {{
 *   dateString: string,
 *   summary: {
 *     steps: number,
 *     active_calories: number,
 *     workout_minutes: number,
 *     sleep_duration_minutes: number,
 *     resting_heart_rate: number,
 *   },
 *   records: {
 *     stepsRecord: Object,
 *     caloriesRecord: Object,
 *     exerciseRecord: Object,
 *     sleepRecord: Object,
 *     restingHeartRateRecord: Object,
 *   }
 * }}
 */
export function generateDemoHealthRecords(targetDate = new Date()) {
  const d = targetDate instanceof Date ? targetDate : new Date(targetDate);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid target date for demo health writer: ${targetDate}`);
  }

  const dateString = formatLocalDateString(d);
  const clientIds = getDemoClientRecordIds(dateString);

  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  // Sleep: 23:00 previous day to 06:12 target day (7h 12m = 432 minutes)
  const sleepStart = new Date(year, month, day - 1, 23, 0, 0, 0);
  const sleepEnd = new Date(year, month, day, 6, 12, 0, 0);

  // Exercise: 07:00 to 07:32 (32 minutes)
  const exerciseStart = new Date(year, month, day, 7, 0, 0, 0);
  const exerciseEnd = new Date(year, month, day, 7, 32, 0, 0);

  // Resting Heart Rate: 06:30
  const rhrTime = new Date(year, month, day, 6, 30, 0, 0);

  // Daily Steps & Active Calories: 06:00 to 21:30
  const dailyStart = new Date(year, month, day, 6, 0, 0, 0);
  const dailyEnd = new Date(year, month, day, 21, 30, 0, 0);

  const stepsRecord = {
    recordType: 'Steps',
    count: 6842,
    startTime: dailyStart.toISOString(),
    endTime: dailyEnd.toISOString(),
    metadata: {
      clientRecordId: clientIds.steps,
    },
  };

  const caloriesRecord = {
    recordType: 'ActiveCaloriesBurned',
    energy: {
      value: 412,
      unit: 'kilocalories',
    },
    startTime: dailyStart.toISOString(),
    endTime: dailyEnd.toISOString(),
    metadata: {
      clientRecordId: clientIds.calories,
    },
  };

  const exerciseRecord = {
    recordType: 'ExerciseSession',
    exerciseType: 0, // OTHER_WORKOUT
    title: 'MantraAI Morning Workout (Demo)',
    notes: 'Synthetic developer exercise session',
    startTime: exerciseStart.toISOString(),
    endTime: exerciseEnd.toISOString(),
    metadata: {
      clientRecordId: clientIds.exercise,
    },
  };

  const sleepRecord = {
    recordType: 'SleepSession',
    title: 'MantraAI Overnight Sleep (Demo)',
    notes: 'Synthetic developer sleep session',
    startTime: sleepStart.toISOString(),
    endTime: sleepEnd.toISOString(),
    metadata: {
      clientRecordId: clientIds.sleep,
    },
  };

  const restingHeartRateRecord = {
    recordType: 'RestingHeartRate',
    beatsPerMinute: 68,
    time: rhrTime.toISOString(),
    metadata: {
      clientRecordId: clientIds.restingHeartRate,
    },
  };

  return {
    dateString,
    summary: {
      steps: 6842,
      active_calories: 412,
      workout_minutes: 32,
      sleep_duration_minutes: 432,
      resting_heart_rate: 68,
    },
    records: {
      stepsRecord,
      caloriesRecord,
      exerciseRecord,
      sleepRecord,
      restingHeartRateRecord,
    },
  };
}

/**
 * Requests the development-only WRITE permissions if not already granted.
 * @returns {Promise<{ isGranted: boolean, grantedList: Array<any> }>}
 */
export async function requestDevWritePermissions() {
  if (Platform.OS !== 'android' || !HealthConnectSDK) {
    return { isGranted: false, grantedList: [] };
  }

  try {
    if (typeof HealthConnectSDK.initialize === 'function') {
      await HealthConnectSDK.initialize();
    }
    const granted = await HealthConnectSDK.requestPermission(DEV_HEALTH_WRITE_PERMISSIONS);
    return {
      isGranted: Array.isArray(granted) && granted.length > 0,
      grantedList: granted || [],
    };
  } catch (err) {
    return { isGranted: false, grantedList: [] };
  }
}

/**
 * Clears ONLY the synthetic demo records created by this demo writer for a given date.
 * Uses exact clientRecordIds so existing user data in Health Connect is never touched.
 * 
 * @param {Date|string} [targetDate] 
 * @returns {Promise<{ success: boolean, clearedDate: string, details: string }>}
 */
export async function clearDemoHealthData(targetDate = new Date()) {
  const d = targetDate instanceof Date ? targetDate : new Date(targetDate);
  const dateString = formatLocalDateString(d);
  const clientIds = getDemoClientRecordIds(dateString);

  if (Platform.OS !== 'android' || !HealthConnectSDK || !HealthConnectSDK.deleteRecordsByUuids) {
    return {
      success: true,
      clearedDate: dateString,
      details: 'Simulation: Demo records cleared for ' + dateString,
    };
  }

  try {
    if (typeof HealthConnectSDK.initialize === 'function') {
      await HealthConnectSDK.initialize();
    }

    // Safely delete each record type by its specific demo clientRecordId
    const deleteTasks = [
      HealthConnectSDK.deleteRecordsByUuids('Steps', [], [clientIds.steps]).catch(() => null),
      HealthConnectSDK.deleteRecordsByUuids('ActiveCaloriesBurned', [], [clientIds.calories]).catch(() => null),
      HealthConnectSDK.deleteRecordsByUuids('ExerciseSession', [], [clientIds.exercise]).catch(() => null),
      HealthConnectSDK.deleteRecordsByUuids('SleepSession', [], [clientIds.sleep]).catch(() => null),
      HealthConnectSDK.deleteRecordsByUuids('RestingHeartRate', [], [clientIds.restingHeartRate]).catch(() => null),
    ];

    await Promise.all(deleteTasks);

    return {
      success: true,
      clearedDate: dateString,
      details: `Successfully cleared demo records for ${dateString} from Health Connect.`,
    };
  } catch (err) {
    return {
      success: false,
      clearedDate: dateString,
      details: `Error clearing demo data: ${err.message}`,
    };
  }
}

/**
 * Populates deterministic synthetic demo records into Android Health Connect.
 * 
 * Idempotent: Automatically deletes prior demo records for the date before inserting.
 * 
 * @param {Date|string} [targetDate]
 * @returns {Promise<{
 *   success: boolean,
 *   date: string,
 *   insertedCount: number,
 *   summary: Object,
 *   message: string
 * }>}
 */
export async function writeDemoHealthData(targetDate = new Date()) {
  const generated = generateDemoHealthRecords(targetDate);
  const { dateString, summary, records } = generated;

  if (Platform.OS !== 'android' || !HealthConnectSDK || !HealthConnectSDK.insertRecords) {
    return {
      success: false,
      date: dateString,
      insertedCount: 0,
      summary,
      message: 'Health Connect native SDK is not available in this environment. Run in Android Development Build.',
    };
  }

  try {
    if (typeof HealthConnectSDK.initialize === 'function') {
      await HealthConnectSDK.initialize();
    }

    // 1. Ensure write permissions
    await requestDevWritePermissions();

    // 2. Clear any prior demo records for this date to prevent duplicate counting
    await clearDemoHealthData(targetDate);

    // 3. Insert each record type individually (HealthConnect requires uniform recordType per call)
    const results = await Promise.all([
      HealthConnectSDK.insertRecords([records.stepsRecord]),
      HealthConnectSDK.insertRecords([records.caloriesRecord]),
      HealthConnectSDK.insertRecords([records.exerciseRecord]),
      HealthConnectSDK.insertRecords([records.sleepRecord]),
      HealthConnectSDK.insertRecords([records.restingHeartRateRecord]),
    ]);

    const totalInserted = results.reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 1), 0);

    return {
      success: true,
      date: dateString,
      insertedCount: totalInserted,
      summary,
      message: `Demo data written to Health Connect for ${dateString}.`,
    };
  } catch (err) {
    return {
      success: false,
      date: dateString,
      insertedCount: 0,
      summary,
      message: `Failed to write demo records to Health Connect: ${err.message}`,
    };
  }
}

export default {
  generateDemoHealthRecords,
  getDemoClientRecordIds,
  requestDevWritePermissions,
  writeDemoHealthData,
  clearDemoHealthData,
};
