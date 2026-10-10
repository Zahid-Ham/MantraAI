import {
  HEALTH_READ_PERMISSIONS,
  mapGrantedPermissions,
  hasAnyPermission,
  hasAllPermissions,
} from '../src/health/healthPermissions';

describe('Health Permissions', () => {
  test('all configured permissions are READ-ONLY (no write permissions)', () => {
    for (const perm of HEALTH_READ_PERMISSIONS) {
      expect(perm.accessType).toBe('read');
      expect(perm.accessType).not.toBe('write');
    }
  });

  test('mapGrantedPermissions correctly flags granted and ungranted record types', () => {
    const mockGranted = [
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'SleepSession' },
    ];

    const status = mapGrantedPermissions(mockGranted);
    expect(status['Steps']).toBe(true);
    expect(status['SleepSession']).toBe(true);
    expect(status['RestingHeartRate']).toBe(false);
    expect(status['ActiveCaloriesBurned']).toBe(false);
  });

  test('hasAnyPermission returns true for partial grants and false for empty', () => {
    expect(hasAnyPermission([])).toBe(false);
    expect(hasAnyPermission([{ accessType: 'read', recordType: 'Steps' }])).toBe(true);
  });

  test('hasAllPermissions verifies full permission coverage', () => {
    const allGranted = HEALTH_READ_PERMISSIONS;
    expect(hasAllPermissions(allGranted)).toBe(true);
    expect(hasAllPermissions([{ accessType: 'read', recordType: 'Steps' }])).toBe(false);
  });
});
