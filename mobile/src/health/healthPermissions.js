/**
 * MantraAI Mobile Health Connect Permissions
 * 
 * IMPORTANT: READ-ONLY access.
 * DO NOT request WRITE permissions.
 * Only request minimum necessary read permissions for daily summary aggregates.
 */

export const HEALTH_READ_PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'RestingHeartRate' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'TotalCaloriesBurned' },
];

/**
 * DEVELOPMENT-ONLY Health Connect write permissions.
 * Used exclusively by the developer demo generator for integration testing without a physical smartwatch.
 * NEVER requested in production or standard user connection flows.
 */
export const DEV_HEALTH_WRITE_PERMISSIONS = [
  { accessType: 'write', recordType: 'Steps' },
  { accessType: 'write', recordType: 'SleepSession' },
  { accessType: 'write', recordType: 'RestingHeartRate' },
  { accessType: 'write', recordType: 'ExerciseSession' },
  { accessType: 'write', recordType: 'ActiveCaloriesBurned' },
];

export const PERMISSION_METRIC_CONFIGS = [
  {
    key: 'steps',
    recordType: 'Steps',
    label: 'Steps',
    description: 'Daily step counts and cadence',
    icon: 'footsteps-outline',
  },
  {
    key: 'active_minutes',
    recordType: 'ExerciseSession',
    label: 'Active Minutes',
    description: 'Moderate to vigorous daily movement',
    icon: 'time-outline',
  },
  {
    key: 'workout_minutes',
    recordType: 'ExerciseSession',
    label: 'Workout Activity',
    description: 'Structured exercise and session duration',
    icon: 'fitness-outline',
  },
  {
    key: 'sleep',
    recordType: 'SleepSession',
    label: 'Sleep Duration',
    description: 'Sleep cycles and total rest time',
    icon: 'moon-outline',
  },
  {
    key: 'resting_hr',
    recordType: 'RestingHeartRate',
    label: 'Resting Heart Rate',
    description: 'Baseline cardiovascular recovery indicator',
    icon: 'heart-outline',
  },
  {
    key: 'active_calories',
    recordType: 'ActiveCaloriesBurned',
    label: 'Active Calories',
    description: 'Energy expended through movement and workouts',
    icon: 'flame-outline',
  },
];

/**
 * Checks a list of granted permissions returned by Health Connect SDK
 * and maps them into a readable status object.
 * 
 * @param {Array<{ accessType: string, recordType: string }>} grantedList 
 * @returns {Record<string, boolean>}
 */
export function mapGrantedPermissions(grantedList = []) {
  const grantedSet = new Set(
    (grantedList || []).map(p => `${p.accessType?.toLowerCase()}:${p.recordType?.toLowerCase()}`)
  );

  const status = {};
  for (const perm of HEALTH_READ_PERMISSIONS) {
    const isGranted = grantedSet.has(`read:${perm.recordType.toLowerCase()}`);
    status[perm.recordType] = isGranted;
  }
  return status;
}

/**
 * Returns true if at least one core health permission is granted.
 */
export function hasAnyPermission(grantedList = []) {
  const status = mapGrantedPermissions(grantedList);
  return Object.values(status).some(Boolean);
}

/**
 * Returns true if all configured read permissions are granted.
 */
export function hasAllPermissions(grantedList = []) {
  const status = mapGrantedPermissions(grantedList);
  return Object.values(status).every(Boolean);
}
