import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome5 } from '@expo/vector-icons';
import { airQualityService, PurpleAirSensor } from '../services/AirQualityService';
import { Card, Text, IconButton } from 'react-native-paper';
import * as Location from 'expo-location';


const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_SIZE = SCREEN_WIDTH * 0.3;
const CACHE_TIME = 30 * 60 * 1000; 
const mockLocation = "New York, NY";


export function AirQualityWidget() {
  const [aqi, setAQI] = useState<number | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<{ temp: string; icon: string; humidity: string; description: string } | null>(null);
  const [sensors, setSensors] = useState<PurpleAirSensor[]>([]);
  const [lastFetched, setLastFetched] = useState<number>(0);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);


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
        setCurrentLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });

        if (address.length > 0) {
          setLocation(`${address[0].city}, ${address[0].region}`);
          fetchWeather(position.coords.latitude, position.coords.longitude);
        } else {
          setError('Unable to get location');
        }
      } catch (err) {
        setError('Error fetching location');
      }
      setLoading(false);
    })();
  }, []);

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.worldweatheronline.com/premium/v1/weather.ashx?key=${WEATHER_API_KEY}&q=${lat},${lon}&format=json`
      );
      const data = await response.json();
      const temp = data.data.current_condition[0].temp_F;
      const icon = data.data.current_condition[0].weatherIconUrl[0].value;
      const humidity = data.data.current_condition[0].humidity;
      const description = data.data.current_condition[0].weatherDesc[0].value;
      setWeather({ temp, icon, humidity, description });
    } catch (err) {
      console.error('Error fetching weather:', err);
    }
  };

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
    useEffect(() => {
      if (currentLocation) {
        fetchData();
      }
    }, [currentLocation]);
  
    const fetchData = async () => {
      if (!currentLocation) return;
  
      try {
        const nearbySensors = await airQualityService.getNearestSensors(currentLocation, 5000);
        const avgAQI = getAverageAQI(nearbySensors);
  
        setAQI(avgAQI);
        setLastFetched(Date.now());
      } catch (error) {
        console.error('Failed to fetch AQI:', error);
        setError('Failed to fetch AQI');
      }
    };
  
    const getAverageAQI = (sensors: PurpleAirSensor[]) => {
      if (sensors.length === 0) return null;
      const totalAQI = sensors.reduce((sum, sensor) => sum + sensor.pm2_5, 0);
      return Math.round(totalAQI / sensors.length);
    };

  return (
    <Card style={[styles.container, { borderColor: getAQIColor(aqi) }]}>
      <Card.Content>
        {loading ? (
          <ActivityIndicator size="small" color="#555" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <Text style={styles.locationText}>{location || 'Unknown Location'}</Text>
        )}

      <View style={styles.contentRow}>
          {/* AQI Section */}
          <View style={styles.aqiContainer}>
            <FontAwesome5 name={getAQIIcon(aqi)} size={50} color={getAQIColor(aqi)} />
            <Text style={styles.aqiText}>AQI: {aqi}</Text>
          </View>

          {/* Weather Section */}
          {weather && (
            <View style={styles.weatherContainer}>
              <Image source={{ uri: weather.icon }} style={styles.weatherIcon} />
              <Text style={styles.weatherText}>{weather.temp}°F</Text>
              <Text style={styles.weatherDetails}>{weather.description}</Text>
              <Text style={styles.weatherDetails}>Humidity: {weather.humidity}%</Text>

            </View>
          )}
        </View>
      </Card.Content>
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
    elevation: 5,
    borderLeftWidth: 6,
    backgroundColor: '#f9f9f9',
  },
  locationText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aqiContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  aqiText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#333',
  },
  weatherContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weatherIcon: {
    width: 50,
    height: 50,
    marginBottom: 5,
  },
  weatherText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  weatherDetails: {
    fontSize: 14,
    color: '#555',
  },
});

export default AirQualityWidget;
