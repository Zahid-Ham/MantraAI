import { Platform } from "react-native";
import Constants from "expo-constants";
import { auth } from "./firebase";

export const DEFAULT_LAN_API_URL = "http://192.168.0.100:8000";

/**
 * Resolves the backend API base URL in order of priority:
 * 1. Explicit environment variable: EXPO_PUBLIC_API_BASE_URL (from .env / eas.json / .env.local)
 * 2. Metro packager IP from hostUri (dynamic LAN IP detection for physical devices in Expo)
 * 3. Development LAN URL fallback for physical devices: http://192.168.0.100:8000
 */
export const getBaseUrl = () => {
  // 1. Explicitly configured environment variable
  const envUrl = typeof process !== 'undefined' && process && process.env ? process.env['EXPO_PUBLIC_API_BASE_URL'] : null;
  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  // 2. Dynamic host URI detection from Metro bundler
  const hostUri = Constants.expoConfig?.hostUri;
  const packagerIp = hostUri ? hostUri.split(":")[0] : null;

  if (packagerIp) {
    return `http://${packagerIp}:8000`;
  }

  // 3. Fallback for physical device development on Wi-Fi LAN
  return DEFAULT_LAN_API_URL;
};

export const BASE_URL = getBaseUrl();

/**
 * Returns safe diagnostic info about current API configuration without secrets.
 */
export const getApiDiagnostics = () => {
  const currentUrl = getBaseUrl();
  const source = (typeof process !== 'undefined' && process?.env?.['EXPO_PUBLIC_API_BASE_URL'])
    ? 'EXPO_PUBLIC_API_BASE_URL'
    : (Constants.expoConfig?.hostUri ? 'metro hostUri' : 'default LAN fallback');
  return {
    target: currentUrl,
    source,
    platform: Platform.OS,
  };
};

/**
 * Generic API request wrapper with dynamic token injection, timeout handling, and error parsing.
 */
export async function apiRequest(endpoint, options = {}) {
  const currentBaseUrl = getBaseUrl();
  const url = `${currentBaseUrl}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Inject Firebase Auth ID token dynamically if user is authenticated
  if (auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers["Authorization"] = `Bearer ${token}`;
    } catch (err) {
      console.warn("API Client: Failed to retrieve Firebase token:", err?.message);
    }
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  // 15-second timeout to prevent indefinite hanging on unreachable network
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  fetchOptions.signal = controller.signal;

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (response.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error (${response.status})`);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error(`Network request to ${currentBaseUrl} timed out. Please check your backend connection.`);
    }
    throw err;
  }
}

export default {
  getBaseUrl,
  BASE_URL,
  DEFAULT_LAN_API_URL,
  getApiDiagnostics,
  apiRequest,
};
