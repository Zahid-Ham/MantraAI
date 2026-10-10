/**
 * MantraAI Health Connect Reader
 * 
 * Safe query wrappers around individual Health Connect record types.
 * Each metric reader isolates query errors so partial permission grants
 * or empty record sets for one metric never fail the entire daily payload.
 */

import { getDayTimeRange } from './healthNormalizer';

/**
 * Reads step count aggregate for a time range.
 * @param {any} hcClient 
 * @param {{ startTime: string, endTime: string }} timeRange 
 * @returns {Promise<any>}
 */
export async function readStepsSafe(hcClient, timeRange) {
  if (!hcClient?.readRecords && !hcClient?.aggregateRecord) return null;
  try {
    if (typeof hcClient.readRecords === 'function') {
      const records = await hcClient.readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: timeRange.startTime,
          endTime: timeRange.endTime,
        },
      });
      return records?.records ?? records ?? null;
    }
  } catch (err) {
    // Return null without leaking health records in error logs
    return null;
  }
  return null;
}

/**
 * Reads sleep session records for a time range.
 * @param {any} hcClient 
 * @param {{ startTime: string, endTime: string }} timeRange 
 * @returns {Promise<any>}
 */
export async function readSleepSessionsSafe(hcClient, timeRange) {
  if (!hcClient?.readRecords) return null;
  try {
    const records = await hcClient.readRecords('SleepSession', {
      timeRangeFilter: {
        operator: 'between',
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
      },
    });
    return records?.records ?? records ?? null;
  } catch (err) {
    return null;
  }
}

/**
 * Reads exercise session records for a time range.
 * @param {any} hcClient 
 * @param {{ startTime: string, endTime: string }} timeRange 
 * @returns {Promise<any>}
 */
export async function readExerciseSessionsSafe(hcClient, timeRange) {
  if (!hcClient?.readRecords) return null;
  try {
    const records = await hcClient.readRecords('ExerciseSession', {
      timeRangeFilter: {
        operator: 'between',
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
      },
    });
    return records?.records ?? records ?? null;
  } catch (err) {
    return null;
  }
}

/**
 * Reads resting heart rate records for a time range.
 * @param {any} hcClient 
 * @param {{ startTime: string, endTime: string }} timeRange 
 * @returns {Promise<any>}
 */
export async function readRestingHeartRateSafe(hcClient, timeRange) {
  if (!hcClient?.readRecords) return null;
  try {
    const records = await hcClient.readRecords('RestingHeartRate', {
      timeRangeFilter: {
        operator: 'between',
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
      },
    });
    return records?.records ?? records ?? null;
  } catch (err) {
    return null;
  }
}

/**
 * Reads active calories burned records for a time range.
 * @param {any} hcClient 
 * @param {{ startTime: string, endTime: string }} timeRange 
 * @returns {Promise<any>}
 */
export async function readActiveCaloriesSafe(hcClient, timeRange) {
  if (!hcClient?.readRecords) return null;
  try {
    const records = await hcClient.readRecords('ActiveCaloriesBurned', {
      timeRangeFilter: {
        operator: 'between',
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
      },
    });
    return records?.records ?? records ?? null;
  } catch (err) {
    return null;
  }
}

/**
 * Reads all daily health metrics for a given date using the provided client.
 * @param {any} hcClient 
 * @param {Date|string} date 
 * @returns {Promise<Object>} raw health data map
 */
export async function queryDayRawMetrics(hcClient, date) {
  const timeRange = getDayTimeRange(date);

  const [steps, sleep, exercise, restingHeartRate, activeCalories] = await Promise.all([
    readStepsSafe(hcClient, timeRange),
    readSleepSessionsSafe(hcClient, timeRange),
    readExerciseSessionsSafe(hcClient, timeRange),
    readRestingHeartRateSafe(hcClient, timeRange),
    readActiveCaloriesSafe(hcClient, timeRange),
  ]);

  return {
    date: timeRange.dateString,
    steps,
    sleep,
    exercise,
    restingHeartRate,
    activeCalories,
  };
}
