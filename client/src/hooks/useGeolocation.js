import { useState, useCallback } from 'react';

/**
 * Hook to request the user's geolocation position.
 * Returns current coords if already fetched, or requests fresh coords on demand.
 */
export function useGeolocation() {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'Geolocation is not supported by your browser';
        setError(msg);
        reject(new Error(msg));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setLatitude(lat);
          setLongitude(lng);
          setLoading(false);
          resolve({ latitude: lat, longitude: lng });
        },
        (err) => {
          let msg = 'Unable to get your location';
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'Location access denied. Please enable location permissions.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = 'Location information is unavailable.';
          } else if (err.code === err.TIMEOUT) {
            msg = 'Location request timed out.';
          }
          setError(msg);
          setLoading(false);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  return { latitude, longitude, error, loading, getCurrentPosition };
}
