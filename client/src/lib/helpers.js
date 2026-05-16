/**
 * Return a greeting based on the current time of day.
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/**
 * Calculate the great-circle distance between two coordinates using the
 * Haversine formula.
 * @returns {number} Distance in meters.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check whether a user's coordinates fall within the allowed geofence radius
 * of the office location.
 * @param {number} userLat
 * @param {number} userLon
 * @param {number} officeLat
 * @param {number} officeLon
 * @param {number} radiusMeters - Allowed radius in meters (default 200).
 * @returns {boolean}
 */
export function isWithinGeofence(userLat, userLon, officeLat, officeLon, radiusMeters = 200) {
  const distance = calculateDistance(userLat, userLon, officeLat, officeLon);
  return distance <= radiusMeters;
}

/**
 * Format a number as Indian Rupee currency string.
 * @param {number} amount
 * @param {string} currency - ISO 4217 code (default 'INR').
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'INR') {
  if (amount == null || isNaN(amount)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Truncate text to a given max length, appending an ellipsis if trimmed.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}
