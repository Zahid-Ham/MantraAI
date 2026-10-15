import { auth } from './firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Get active Firebase ID token dynamically if user is signed in
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers["Authorization"] = `Bearer ${token}`;
    } catch (err) {
      console.error("API Client Error fetching auth token:", err);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Token expired or invalid, redirect to login page
    window.location.hash = "#login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = `HTTP API Error ${response.status}`;
    if (typeof errorData.detail === 'string') {
      errorMessage = errorData.detail;
    } else if (Array.isArray(errorData.detail)) {
      errorMessage = errorData.detail.map((d) => d.msg || d.message || JSON.stringify(d)).join('; ');
    } else if (errorData.detail && typeof errorData.detail === 'object') {
      errorMessage = errorData.detail.message || errorData.detail.error || JSON.stringify(errorData.detail);
    } else if (typeof errorData.message === 'string') {
      errorMessage = errorData.message;
    } else if (typeof errorData.error === 'string') {
      errorMessage = errorData.error;
    }

    const err = new Error(errorMessage);
    err.status = response.status;
    err.detail = errorData.detail;
    err.data = errorData;
    err.code = (errorData.detail && typeof errorData.detail === 'object' ? errorData.detail.error : null) || errorData.code || errorData.error;
    throw err;
  }

  return await response.json();
}
