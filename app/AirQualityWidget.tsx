import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome5 } from '@expo/vector-icons';
import { airQualityService, PurpleAirSensor } from '../services/AirQualityService';
import { Card, Text, IconButton } from 'react-native-paper';
import * as Location from 'expo-location';



const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_SIZE = SCREEN_WIDTH * 0.3;
const CACHE_TIME = 30 * 60 * 1000; // Cache data for 30 minutes
const mockAQI = 175;
const mockLocation = "New York, NY";

export function AirQualityWidget() {
  const [aqi] = useState(mockAQI);
  const [location, setLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          setLoading(false);
          return;
        }

        let position = await Location.getCurrentPositionAsync({});
        let address = await Location.reverseGeocodeAsync(position.coords);

        if (address.length > 0) {
          setLocation(`${address[0].city}, ${address[0].region}`);
        } else {
          setError('Unable to get location');
        }
      } catch (err) {
        setError('Error fetching location');
      }
      setLoading(false);
    })();
  }, []);

    const getAQIColor = (aqi) => {
      if (aqi <= 50) return '#00E400'; // Good (Green)
      if (aqi <= 100) return '#FFFF00'; // Moderate (Yellow)
      if (aqi <= 150) return '#FF7E00'; // Unhealthy for Sensitive Groups (Orange)
      if (aqi <= 200) return '#FF0000'; // Unhealthy (Red)
      if (aqi <= 300) return '#8F3F97'; // Very Unhealthy (Purple)
      return '#7E0023'; // Hazardous (Maroon)
    };

    const getAQIIcon = (aqi) => {
      if (aqi <= 50) return 'smile'; 
      if (aqi <= 100) return 'meh'; 
      if (aqi <= 150) return 'frown'; 
      if (aqi <= 200) return 'skull'; 
      if (aqi <= 300) return 'exclamation-triangle'; 
      return 'biohazard'; 
    };
  // const [sensors, setSensors] = useState<PurpleAirSensor[]>([]);
  // const [currentLocation] = useState({
  //   latitude: 40.7128,
  //   longitude: -74.0060
  // });
  // const [lastFetched, setLastFetched] = useState<number>(0);

  // const fetchData = async () => {
  //   try {
  //     const nearbySensors = await airQualityService.getNearestSensors(currentLocation, 5000);
  //     setSensors(nearbySensors);
  //     setLastFetched(Date.now());
  //     console.log('Fetched sensors:', nearbySensors);
  //   } catch (error) {
  //     console.error('Failed to fetch sensors:', error);
  //   }
  // };

  // // Use effect for data fetching
  // useEffect(() => {
    
  //   const currentTime = Date.now();

  //   // Check if cached data is still valid (within the last CACHE_TIME)
  //   if (currentTime - lastFetched > CACHE_TIME) {
  //     fetchData();
  //   } else {
  //     console.log('Using cached data.');
  //   }

  //   const interval = setInterval(() => {
  //     if (currentTime - lastFetched > CACHE_TIME) {
  //       fetchData();
  //     }
  //   }, 10 * 60 * 1000); // Check every 10 minutes

  //   return () => clearInterval(interval);
  // }, [currentLocation, lastFetched]);

  // const getAverageAQI = () => {
  //   if (sensors.length === 0) return 0;
  //   const totalAQI = sensors.reduce((sum, sensor) => sum + sensor.pm2_5, 0);
  //   return totalAQI / sensors.length;
  // };

  return (
    <Card style={[styles.container, { borderLeftColor: getAQIColor(aqi) }]}> 
      <Card.Content>
        {loading ? (
          <ActivityIndicator size="small" color="#555" />
        ) : error ? (
          <Text variant="bodyMedium" style={styles.errorText}>{error}</Text>
        ) : (
          <Text variant="titleMedium" style={styles.locationText}>{location}</Text>
        )}
        
        <View style={styles.row}>
          <FontAwesome5 name={getAQIIcon(aqi)} size={40} color={getAQIColor(aqi)} style={styles.icon} />
          <Text variant="headlineLarge" style={styles.aqiText}>AQI: {aqi}</Text>
        </View>
      </Card.Content>
      <Card.Actions>
        <IconButton icon="refresh" size={24} onPress={() => {}} />
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '90%',
    padding: 20,
    borderRadius: 15,
    alignSelf: 'center',
    marginVertical: 10,
    elevation: 3,
    borderLeftWidth: 5,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aqiText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  icon: {
    marginRight: 10,
  },
});

export default AirQualityWidget;
