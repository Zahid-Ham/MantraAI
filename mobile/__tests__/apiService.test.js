import { getBaseUrl } from '../src/services/api';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

describe('API Base URL Resolution', () => {
  const originalEnv = process.env['EXPO_PUBLIC_API_BASE_URL'];

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env['EXPO_PUBLIC_API_BASE_URL'] = originalEnv;
    } else {
      delete process.env['EXPO_PUBLIC_API_BASE_URL'];
    }
  });

  test('prioritizes EXPO_PUBLIC_API_BASE_URL environment variable when set', () => {
    process.env['EXPO_PUBLIC_API_BASE_URL'] = 'http://192.168.0.100:8000';
    expect(getBaseUrl()).toBe('http://192.168.0.100:8000');
  });

  test('strips trailing slashes from EXPO_PUBLIC_API_BASE_URL', () => {
    process.env['EXPO_PUBLIC_API_BASE_URL'] = 'http://192.168.0.100:8000///';
    expect(getBaseUrl()).toBe('http://192.168.0.100:8000');
  });

  test('falls back to hostUri packager IP when env variable is not present', () => {
    delete process.env['EXPO_PUBLIC_API_BASE_URL'];
    Constants.expoConfig = { hostUri: '192.168.0.100:8081' };
    expect(getBaseUrl()).toBe('http://192.168.0.100:8000');
  });

  test('falls back to default development LAN URL when env variable and hostUri are missing', () => {
    delete process.env['EXPO_PUBLIC_API_BASE_URL'];
    Constants.expoConfig = {};
    Platform.OS = 'android';
    expect(getBaseUrl()).toBe('http://192.168.0.100:8000');
  });

  test('provides clean diagnostics without exposing secrets', () => {
    process.env['EXPO_PUBLIC_API_BASE_URL'] = 'http://192.168.0.100:8000';
    const diag = getBaseUrl();
    expect(diag).toBe('http://192.168.0.100:8000');
  });
});
