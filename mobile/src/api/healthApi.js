/**
 * MantraAI Mobile Health API Client
 * 
 * Interacts with the existing FastAPI backend health endpoints:
 * - POST /api/v1/health/sync
 * - GET  /api/v1/health/daily/latest
 * - GET  /api/v1/health/daily
 * - GET  /api/v1/goals/today
 */

import { apiRequest, BASE_URL } from '../services/api';
import healthConnectManager from '../health/HealthConnectManager';

/**
 * Checks connection readiness between mobile Health Connect and backend.
 * @returns {Promise<{
 *   healthConnect: any,
 *   backendUrl: string,
 *   isAuthenticated: boolean
 * }>}
 */
export async function connectHealthData() {
  const availability = await healthConnectManager.checkHealthConnectAvailability();
  const permissions = await healthConnectManager.getPermissions();

  return {
    healthConnect: {
      ...availability,
      permissions,
    },
    backendUrl: BASE_URL,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Syncs normalized daily health data to the FastAPI backend.
 * 
 * Supports both single day sync and multi-day array payloads.
 * Backend stores records in PostgreSQL health_daily_metrics idempotently.
 * 
 * @param {Object|Array<Object>} inputData 
 * @returns {Promise<any>}
 */
export async function syncHealthData(inputData) {
  let metricsList = [];

  if (Array.isArray(inputData)) {
    metricsList = inputData;
  } else if (inputData && Array.isArray(inputData.metrics)) {
    metricsList = inputData.metrics;
  } else if (inputData && typeof inputData === 'object') {
    metricsList = [inputData];
  }

  // Ensure all items declare source as "health_connect"
  const formattedMetrics = metricsList.map((m) => ({
    source: 'health_connect',
    date: m.date,
    steps: m.steps ?? null,
    active_minutes: m.active_minutes ?? null,
    workout_minutes: m.workout_minutes ?? null,
    sleep_duration_minutes: m.sleep_duration_minutes ?? null,
    resting_heart_rate: m.resting_heart_rate ?? null,
    active_calories: m.active_calories ?? null,
  }));

  const payload = {
    source: 'health_connect',
    metrics: formattedMetrics,
  };

  return await apiRequest('/api/v1/health/sync', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetches the latest persisted health metrics for the user from backend.
 * @returns {Promise<any>}
 */
export async function getLatestHealthData() {
  return await apiRequest('/api/v1/health/daily/latest');
}

/**
 * Fetches daily health history for the past N days.
 * @param {number} days 
 * @returns {Promise<any>}
 */
export async function getDailyHealthHistory(days = 7) {
  return await apiRequest(`/api/v1/health/daily?days=${days}`);
}

/**
 * Fetches today's adaptive personalized daily goals.
 * @returns {Promise<any>}
 */
export async function getTodayGoals() {
  return await apiRequest('/api/v1/goals/today');
}
