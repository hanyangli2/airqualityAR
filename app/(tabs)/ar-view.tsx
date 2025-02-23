import { StyleSheet } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AirQualityHUD } from '@/components/AirQualityHUD';
import { AirQualityAR } from '@/components/AirQualityAR';
import { airQualityService, PurpleAirSensor } from '@/services/AirQualityService';

// Required for Three.js
const global = globalThis as any;
if (global.document === undefined) {
  global.document = {
    createElement: () => ({
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    createElementNS: (_namespace: string, type: string) => ({
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      setAttribute: () => {},
      getElementsByTagName: () => [],
    }),
  };
}

export default function ARViewScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [sensors, setSensors] = useState<PurpleAirSensor[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [heading, setHeading] = useState(0);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Handle camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Handle location updates
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setLocationError('Location permission denied');
          return;
        }

        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        setCurrentLocation({
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude
        });

        const locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10
          },
          (location) => {
            setCurrentLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            });
          }
        );

        return () => {
          locationSubscription.remove();
        };
      } catch (error) {
        setLocationError(error instanceof Error ? error.message : 'Failed to get location');
      }
    })();
  }, []);

  // Handle heading updates
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const startHeadingUpdates = async () => {
      try {
        subscription = await Location.watchHeadingAsync((headingData) => {
          const newHeading = headingData.trueHeading ?? headingData.magHeading;
          setHeading(newHeading);
        });
      } catch (error) {
        console.error('Error setting up heading updates:', error);
      }
    };

    startHeadingUpdates();

    return () => {
      subscription?.remove();
    };
  }, []);

  // Fetch sensor data
  useEffect(() => {
    if (!currentLocation) return;

    const fetchData = async () => {
      try {
        const nearbySensors = await airQualityService.getNearestSensors(currentLocation, 2000);
        setSensors(nearbySensors);
      } catch (error) {
        console.error('Failed to fetch sensors:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [currentLocation]);

  if (hasPermission === null) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </ThemedView>
    );
  }

  if (hasPermission === false) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>No access to camera</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={StyleSheet.absoluteFill}>
      <CameraView style={StyleSheet.absoluteFill}>
        {sensors.length > 0 && currentLocation && (
          <AirQualityAR 
            sensors={sensors}
            currentLocation={currentLocation}
            heading={heading}
          />
        )}
        <AirQualityHUD 
          sensors={sensors}
          currentLocation={currentLocation}
          heading={heading}
          locationError={locationError}
        />
      </CameraView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});