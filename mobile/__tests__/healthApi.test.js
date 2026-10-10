import { syncHealthData, getLatestHealthData, getTodayGoals } from '../src/api/healthApi';
import * as apiService from '../src/services/api';

jest.mock('../src/services/api', () => ({
  apiRequest: jest.fn(),
  BASE_URL: 'http://10.0.2.2:8000',
}));

describe('Mobile Health API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('syncHealthData formats single daily metric into canonical sync payload', async () => {
    apiService.apiRequest.mockResolvedValueOnce({
      success: true,
      synced_count: 1,
      source: 'health_connect',
    });

    const metric = {
      date: '2026-10-04',
      steps: 5320,
      active_minutes: 31,
      workout_minutes: 20,
      sleep_duration_minutes: 421,
      resting_heart_rate: 68,
      active_calories: 412,
    };

    const res = await syncHealthData(metric);

    expect(apiService.apiRequest).toHaveBeenCalledTimes(1);
    const [endpoint, options] = apiService.apiRequest.mock.calls[0];

    expect(endpoint).toBe('/api/v1/health/sync');
    expect(options.method).toBe('POST');

    const parsedBody = JSON.parse(options.body);
    expect(parsedBody.source).toBe('health_connect');
    expect(parsedBody.metrics).toHaveLength(1);
    expect(parsedBody.metrics[0]).toEqual({
      source: 'health_connect',
      date: '2026-10-04',
      steps: 5320,
      active_minutes: 31,
      workout_minutes: 20,
      sleep_duration_minutes: 421,
      resting_heart_rate: 68,
      active_calories: 412,
    });
    expect(res.synced_count).toBe(1);
  });

  test('syncHealthData formats 7-day multi-day batch payload correctly', async () => {
    apiService.apiRequest.mockResolvedValueOnce({
      success: true,
      synced_count: 7,
      source: 'health_connect',
    });

    const weekData = [
      { date: '2026-09-28', steps: 4000 },
      { date: '2026-09-29', steps: 5100 },
      { date: '2026-09-30', steps: null },
      { date: '2026-10-01', steps: 6200 },
      { date: '2026-10-02', steps: 7500 },
      { date: '2026-10-03', steps: 4800 },
      { date: '2026-10-04', steps: 5320 },
    ];

    const res = await syncHealthData(weekData);

    const [, options] = apiService.apiRequest.mock.calls[0];
    const parsedBody = JSON.parse(options.body);

    expect(parsedBody.source).toBe('health_connect');
    expect(parsedBody.metrics).toHaveLength(7);
    expect(parsedBody.metrics[2].steps).toBeNull(); // Missing metric preserved
    expect(res.synced_count).toBe(7);
  });

  test('propagates backend failure and timeout errors', async () => {
    apiService.apiRequest.mockRejectedValueOnce(
      new Error('Network request timed out. Please check your server connection.')
    );

    await expect(syncHealthData({ date: '2026-10-04', steps: 1000 })).rejects.toThrow(
      'Network request timed out'
    );
  });
});
