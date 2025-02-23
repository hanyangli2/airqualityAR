import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AirQualityHUD } from '@/components/AirQualityHUD';
import { AirQualityAR } from '@/components/AirQualityAR';
import { airQualityService, PurpleAirSensor } from '@/services/AirQualityService';
import { getAQIColor } from '@/utils/aqi';

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
  const [selectedSensor, setSelectedSensor] = useState<PurpleAirSensor | null>(null);

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
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentLocation]);

  const handleSensorSelect = (sensorData: PurpleAirSensor) => {
    setSelectedSensor(sensorData);
  };

  const getAirQualityDescription = (pm2_5: number): string => {
    if (pm2_5 <= 12.0) return "Air quality is excellent! YAAYY!!!!!";
    if (pm2_5 <= 35.4) return "Air quality is moderate. Generally safe for most people!";
    if (pm2_5 <= 55.4) return "Air quality is concerning. Sensitive groups should be careful.";
    if (pm2_5 <= 150.4) return "Air quality is unhealthy. Limit outdoor exposure.";
    if (pm2_5 <= 250.4) return "Air quality is very unhealthy! Avoid outdoor activities.";
    return "Air quality is hazardous! You are going to DIE if you come here!";
  };

  const calculateDistance = (sensor: PurpleAirSensor): string => {
    if (!currentLocation) return "Unknown";
    
    const R = 6371e3; // Earth's radius in meters
    const φ1 = currentLocation.latitude * Math.PI/180;
    const φ2 = sensor.latitude * Math.PI/180;
    const Δφ = (sensor.latitude - currentLocation.latitude) * Math.PI/180;
    const Δλ = (sensor.longitude - currentLocation.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance < 1000 
      ? `${Math.round(distance)}m away`
      : `${(distance/1000).toFixed(1)}km away`;
  };

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
            onSensorSelect={handleSensorSelect}
          />
        )}
        <AirQualityHUD 
          sensors={sensors}
          currentLocation={currentLocation}
          heading={heading}
          locationError={locationError}
        />
        
        {/* Enhanced Sensor Info Modal */}
        {selectedSensor && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Sensor #{selectedSensor.sensor_index}
              </Text>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Distance:</Text>
                <Text style={styles.modalValue}>
                  {calculateDistance(selectedSensor)}
                </Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Air Quality:</Text>
                <Text style={[
                  styles.modalValue,
                  { color: getAQIColor(selectedSensor.pm2_5) }
                ]}>
                  {selectedSensor.pm2_5.toFixed(1)} µg/m³
                </Text>
              </View>

              <Text style={styles.modalDescription}>
                {getAirQualityDescription(selectedSensor.pm2_5)}
              </Text>

              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedSensor(null)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    width: '80%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
    paddingHorizontal: 10,
    color: '#444',
  },
  closeButton: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});