/**
 * Geo-Fencing Utilities for QR Attendance
 * Uses Haversine formula to calculate distance between two geographic coordinates
 */

const EARTH_RADIUS_METERS = 6371000; // Earth's mean radius in meters

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the distance between two geographic points using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lon1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lon2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Check if a participant's coordinates are within the geo-fence radius.
 * @param {Object} participantCoords - { latitude, longitude }
 * @param {Object} geoFence - { latitude, longitude, radiusMeters }
 * @returns {{ allowed: boolean, distance: number }} Whether the participant is within range and their distance
 */
export function isWithinGeoFence(participantCoords, geoFence) {
  const distance = calculateDistance(
    geoFence.latitude,
    geoFence.longitude,
    participantCoords.latitude,
    participantCoords.longitude
  );

  return {
    allowed: distance <= geoFence.radiusMeters,
    distance: Math.round(distance), // distance in meters (rounded)
  };
}
