import * as Location from 'expo-location';

// Returns { latitude, longitude } from the device GPS.
// Throws an Error with a user-facing message if permission is denied or GPS fails.
export async function getCurrentCoords() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission was denied. Please allow location access in your phone settings.');
  }

  const servicesOn = await Location.hasServicesEnabledAsync();
  if (!servicesOn) {
    throw new Error('Location services are turned off. Please switch on GPS / Location and try again.');
  }

  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}
