import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { airQualityService, PurpleAirSensor } from '../services/AirQualityService';


const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_SIZE = SCREEN_WIDTH * 0.3;
const CACHE_TIME = 30 * 60 * 1000; // Cache data for 30 minutes

export function AirQualityWidget() {
  const [sensors, setSensors] = useState<PurpleAirSensor[]>([]);
  const [currentLocation] = useState({
    latitude: 40.7128,
    longitude: -74.0060
  });
  const [lastFetched, setLastFetched] = useState<number>(0);

  const fetchData = async () => {
    try {
      const nearbySensors = await airQualityService.getNearestSensors(currentLocation, 5000);
      setSensors(nearbySensors);
      setLastFetched(Date.now());
      console.log('Fetched sensors:', nearbySensors);
    } catch (error) {
      console.error('Failed to fetch sensors:', error);
    }
  };

  // Use effect for data fetching
  useEffect(() => {
    const currentTime = Date.now();

    // Check if cached data is still valid (within the last CACHE_TIME)
    if (currentTime - lastFetched > CACHE_TIME) {
      fetchData();
    } else {
      console.log('Using cached data.');
    }

    const interval = setInterval(() => {
      if (currentTime - lastFetched > CACHE_TIME) {
        fetchData();
      }
    }, 10 * 60 * 1000); // Check every 10 minutes

    return () => clearInterval(interval);
  }, [currentLocation, lastFetched]);

  const getAverageAQI = () => {
    if (sensors.length === 0) return 0;
    const totalAQI = sensors.reduce((sum, sensor) => sum + sensor.pm2_5, 0);
    return totalAQI / sensors.length;
  };

  return (
    <View style={styles.container}>
      {/* Top Bar with current AQI */}
      <View style={styles.topBar}>
        <ThemedText style={styles.aqiText}>
          AQI: {sensors.length > 0 ? Math.round(sensors[0].pm2_5) : '---'}
        </ThemedText>
        <ThemedText style={styles.aqiText}>
          Average AQI: {sensors.length > 0 ? Math.round(getAverageAQI()) : '---'}
        </ThemedText>
      </View>

      {/* Minimap and other UI components remain the same */}

      {/* Bottom info panel */}
      <View style={styles.bottomPanel}>
        <ThemedText style={styles.infoText}>
          Nearby Sensors: {sensors.length}
        </ThemedText>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 100,
  },
  aqiText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
  },
});

export default AirQualityWidget;
