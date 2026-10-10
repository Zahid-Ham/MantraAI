/**
 * MantraAI Health Connect Manager
 * 
 * Android-first native Health Connect bridge integration.
 * Manages SDK availability, permission handshakes, and daily metric aggregation.
 */

import { Platform } from 'react-native';
import {
  HEALTH_READ_PERMISSIONS,
  mapGrantedPermissions,
  hasAnyPermission,
  hasAllPermissions,
} from './healthPermissions';
import { queryDayRawMetrics } from './healthReader';
import { normalizeDailyHealthData, formatLocalDateString } from './healthNormalizer';

// Lazy-load react-native-health-connect to allow graceful fallbacks in non-native / test environments
let HealthConnectSDK = null;
try {
  HealthConnectSDK = require('react-native-health-connect');
} catch (e) {
  HealthConnectSDK = null;
}

export const HEALTH_CONNECT_STATUS = {
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
  UPDATE_REQUIRED: 'update_required',
  NOT_ANDROID: 'not_android',
  SDK_NOT_LOADED: 'sdk_not_loaded',
};

class HealthConnectManager {
  constructor() {
    this.isInitialized = false;
    this.cachedStatus = null;
    this.grantedPermissions = [];
  }

  /**
   * Checks whether Android Health Connect is available on this device.
   * 
   * Android 14+ integrates Health Connect directly into framework.
   * Android 13- requires the Health Connect APK.
   * 
   * @returns {Promise<{
   *   status: string,
   *   isAvailable: boolean,
   *   canConnect: boolean,
   *   message: string
   * }>}
   */
  async checkHealthConnectAvailability() {
    if (Platform.OS !== 'android') {
      const result = {
        status: HEALTH_CONNECT_STATUS.NOT_ANDROID,
        isAvailable: false,
        canConnect: false,
        message: 'Health Connect is only supported on Android devices.',
      };
      this.cachedStatus = result;
      return result;
    }

    if (!HealthConnectSDK || !HealthConnectSDK.getSdkStatus) {
      const result = {
        status: HEALTH_CONNECT_STATUS.SDK_NOT_LOADED,
        isAvailable: false,
        canConnect: false,
        message: 'Health Connect native module is not linked in this build. Requires Expo Development Build.',
      };
      this.cachedStatus = result;
      return result;
    }

    try {
      const sdkStatus = await HealthConnectSDK.getSdkStatus();
      
      // SdkAvailabilityStatus:
      // 1 = SDK_UNAVAILABLE (Health Connect not supported or not installed)
      // 2 = SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED (Health Connect requires update)
      // 3 = SDK_AVAILABLE (Health Connect is installed and ready)
      const SdkAvailabilityStatus = HealthConnectSDK.SdkAvailabilityStatus || {
        SDK_UNAVAILABLE: 1,
        SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: 2,
        SDK_AVAILABLE: 3,
      };

      if (sdkStatus === SdkAvailabilityStatus.SDK_AVAILABLE || sdkStatus === 3) {
        const result = {
          status: HEALTH_CONNECT_STATUS.AVAILABLE,
          isAvailable: true,
          canConnect: true,
          message: 'Health Connect is available and ready.',
        };
        this.cachedStatus = result;
        return result;
      } else if (
        sdkStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED ||
        sdkStatus === 2
      ) {
        const result = {
          status: HEALTH_CONNECT_STATUS.UPDATE_REQUIRED,
          isAvailable: false,
          canConnect: false,
          message: 'Health Connect needs to be updated from the Google Play Store.',
        };
        this.cachedStatus = result;
        return result;
      } else {
        const result = {
          status: HEALTH_CONNECT_STATUS.UNAVAILABLE,
          isAvailable: false,
          canConnect: false,
          message: 'Health Connect is not installed or not available on this device.',
        };
        this.cachedStatus = result;
        return result;
      }
    } catch (err) {
      const result = {
        status: HEALTH_CONNECT_STATUS.UNAVAILABLE,
        isAvailable: false,
        canConnect: false,
        message: 'Could not determine Health Connect status.',
      };
      this.cachedStatus = result;
      return result;
    }
  }

  /**
   * Initializes the Health Connect client if available.
   * @returns {Promise<boolean>}
   */
  async initializeClient() {
    if (this.isInitialized) return true;

    const availability = await this.checkHealthConnectAvailability();
    if (!availability.canConnect) {
      return false;
    }

    try {
      if (typeof HealthConnectSDK.initialize === 'function') {
        const initResult = await HealthConnectSDK.initialize();
        this.isInitialized = Boolean(initResult ?? true);
      } else {
        this.isInitialized = true;
      }
      return this.isInitialized;
    } catch (err) {
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Queries currently granted Health Connect permissions.
   * @returns {Promise<{
   *   grantedList: Array<{ accessType: string, recordType: string }>,
   *   statusMap: Record<string, boolean>,
   *   hasAny: boolean,
   *   hasAll: boolean
   * }>}
   */
  async getPermissions() {
    if (Platform.OS !== 'android' || !HealthConnectSDK) {
      return {
        grantedList: [],
        statusMap: mapGrantedPermissions([]),
        hasAny: false,
        hasAll: false,
      };
    }

    try {
      await this.initializeClient();
      const granted = (await HealthConnectSDK.getGrantedPermissions?.()) || [];
      this.grantedPermissions = granted;

      return {
        grantedList: granted,
        statusMap: mapGrantedPermissions(granted),
        hasAny: hasAnyPermission(granted),
        hasAll: hasAllPermissions(granted),
      };
    } catch (err) {
      return {
        grantedList: [],
        statusMap: mapGrantedPermissions([]),
        hasAny: false,
        hasAll: false,
      };
    }
  }

  /**
   * Requests read permissions for the configured MantraAI data types.
   * Prompts the official Android Health Connect permission dialog.
   * 
   * @returns {Promise<{
   *   grantedList: Array<{ accessType: string, recordType: string }>,
   *   statusMap: Record<string, boolean>,
   *   hasAny: boolean,
   *   hasAll: boolean
   * }>}
   */
  async requestPermissions() {
    if (Platform.OS !== 'android' || !HealthConnectSDK) {
      throw new Error('Health Connect is only supported on Android devices with an Expo Development Build.');
    }

    await this.initializeClient();

    try {
      const granted = await HealthConnectSDK.requestPermission(HEALTH_READ_PERMISSIONS);
      this.grantedPermissions = granted || [];

      return {
        grantedList: this.grantedPermissions,
        statusMap: mapGrantedPermissions(this.grantedPermissions),
        hasAny: hasAnyPermission(this.grantedPermissions),
        hasAll: hasAllPermissions(this.grantedPermissions),
      };
    } catch (err) {
      // Re-query currently granted permissions in case of partial or cancelled prompt
      return await this.getPermissions();
    }
  }

  /**
   * Opens Android Health Connect settings screen.
   */
  async openSettings() {
    if (Platform.OS === 'android' && HealthConnectSDK?.openHealthConnectSettings) {
      try {
        await HealthConnectSDK.openHealthConnectSettings();
      } catch (e) {
        // Fallback or ignore
      }
    }
  }

  /**
   * Reads and normalizes daily health data for a specific date.
   * 
   * @param {Date|string} [date] - Target date (defaults to today)
   * @returns {Promise<NormalizedDailyHealthData>}
   */
  async readDailyHealthData(date = new Date()) {
    if (Platform.OS !== 'android' || !HealthConnectSDK) {
      // Return empty normalized template for the requested date without crashing
      return normalizeDailyHealthData({ date });
    }

    await this.initializeClient();

    try {
      const rawMetrics = await queryDayRawMetrics(HealthConnectSDK, date);
      return normalizeDailyHealthData(rawMetrics);
    } catch (err) {
      return normalizeDailyHealthData({ date });
    }
  }

  /**
   * Reads and normalizes health data for the past N days (e.g. 7 days).
   * 
   * @param {number} numDays - Number of days to query (e.g. 7)
   * @returns {Promise<Array<NormalizedDailyHealthData>>}
   */
  async readDaysHealthData(numDays = 7) {
    const results = [];
    const today = new Date();

    for (let i = numDays - 1; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      const dayData = await this.readDailyHealthData(targetDate);
      results.push(dayData);
    }

    return results;
  }
}

export const healthConnectManager = new HealthConnectManager();
export default healthConnectManager;
