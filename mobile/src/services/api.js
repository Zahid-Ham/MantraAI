import { Platform } from "react-native";
import Constants from "expo-constants";
import { auth } from "./firebase";

// Dynamic API URL: detects developer's computer IP dynamically to support physical devices
const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  const packagerIp = hostUri ? hostUri.split(":")[0] : null;
  
  if (packagerIp) {
    return `http://${packagerIp}:8000`;
  }
  
  return Platform.select({
    android: "http://10.0.2.2:8000",
    ios: "http://localhost:8000",
    default: "http://localhost:8000",
  });
};

export const BASE_URL = getBaseUrl();

export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Inject Firebase Auth ID token dynamically if the user is authenticated
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers["Authorization"] = `Bearer ${token}`;
    } catch (err) {
      console.error("API Client Error fetching Firebase token:", err);
    }
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  // Add timeout fallback to avoid long hanging requests
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000);
  fetchOptions.signal = controller.signal;

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(id);

    if (response.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error (${response.status})`);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(id);
    if (err.name === "AbortError") {
      throw new Error("Network request timed out. Please check your server connection.");
    }
    throw err;
  }
}
