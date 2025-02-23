import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { airQualityService, PurpleAirSensor } from '../services/AirQualityService';


// Function to calculate AQI from PM2.5
const calculateAQI = (pm25: number): number => {
  if (pm25 <= 12.0) return 50 * (pm25 / 12.0); // Good
  if (pm25 <= 35.4) return 50 + (pm25 - 12.0) * (50 / 23.4); // Moderate
  if (pm25 <= 55.4) return 100 + (pm25 - 35.4) * (50 / 20); // Unhealthy for Sensitive Groups
  if (pm25 <= 150.4) return 150 + (pm25 - 55.4) * (50 / 95); // Unhealthy
  if (pm25 <= 250.4) return 200 + (pm25 - 150.4) * (50 / 100); // Very Unhealthy
  return 300; // Hazardous
};

const AirQualityWidget = ({ latitude, longitude }: { latitude: number, longitude: number }) => {
  const [aqi, setAqi] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAirQualityData = async () => {
      try {
        // Fetch sensors near the given latitude and longitude
        const nearbySensors = await airQualityService.getNearestSensors({ latitude, longitude }, 2000);
        
        if (nearbySensors.length > 0) {
          // Calculate the average AQI from the sensors
          const averagePM25 = nearbySensors.reduce((sum, sensor) => sum + sensor.pm2_5, 0) / nearbySensors.length;
          const averageAQI = calculateAQI(averagePM25);
          setAqi(averageAQI);
        } else {
          setError('No sensors found nearby.');
        }
      } catch (err) {
        setError('Failed to fetch air quality data.');
        console.error(err);
      }
    };

    fetchAirQualityData();
  }, [latitude, longitude]);

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : aqi !== null ? (
        <Text style={styles.aqiText}>AQI: {aqi.toFixed(2)}</Text>
      ) : (
        <Text style={styles.loadingText}>Loading AQI...</Text>
      )}
    </View>
  );
};

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
    fontSize: 20,
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