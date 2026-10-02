import { apiRequest } from '../config/api';

/**
 * Determines whether an authenticated user should land on #assess (0 completed assessments)
 * or #dashboard (>= 1 completed assessment).
 * Falls back safely to #dashboard on network or API failure rather than treating the user as first-time.
 */
export async function getAuthenticatedEntryRoute() {
  try {
    const sessions = await apiRequest('/api/v1/assessments');
    if (Array.isArray(sessions)) {
      const completed = sessions.filter((s) => s.status === 'COMPLETED');
      return completed.length > 0 ? '#dashboard' : '#assess';
    }
    return '#dashboard';
  } catch (err) {
    console.warn('Unable to verify completed assessment count from server:', err);
    // Safe fallback for authenticated users: never assume zero assessments on error
    return '#dashboard';
  }
}

/**
 * Handles landing page "Get Started" / "Start Your Assessment" CTA clicks.
 * If not authenticated, redirects to login/signup.
 * If authenticated, checks assessment history and routes to #assess (0 completed) or #dashboard (>= 1 completed).
 */
export async function handleGetStartedNavigation(e, isAuthenticated) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
  if (!isAuthenticated) {
    sessionStorage.removeItem('mantra_auth_redirect');
    window.location.hash = '#login';
    return;
  }
  const route = await getAuthenticatedEntryRoute();
  window.location.hash = route;
}
