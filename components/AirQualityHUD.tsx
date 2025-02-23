import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { ThemedText } from './ThemedText';
import * as Location from 'expo-location';
import { airQualityService, PurpleAirSensor } from '../services/AirQualityService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_SIZE = SCREEN_WIDTH * 0.3;

export function AirQualityHUD() {
  const [sensors, setSensors] = useState<PurpleAirSensor[]>([]);
  const [currentLocation] = useState({
    latitude: 40.783058,
    longitude: -73.971252
  });

  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const nearbySensors = await airQualityService.getNearestSensors(currentLocation, 2000);
        setSensors(nearbySensors);
        console.log('Fetched sensors:', nearbySensors); 
      } catch (error) {
        console.error('Failed to fetch sensors:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentLocation]);

  const getRelativePosition = (sensor: PurpleAirSensor) => {
    const maxLat = Math.max(...sensors.map(s => Math.abs(s.latitude - currentLocation.latitude)));
    const maxLng = Math.max(...sensors.map(s => Math.abs(s.longitude - currentLocation.longitude)));
    const maxDistance = Math.max(maxLat, maxLng) * 1.2;

    const relativeX = (sensor.longitude - currentLocation.longitude) / (maxDistance * 2) + 0.5;
    const relativeY = (sensor.latitude - currentLocation.latitude) / (maxDistance * 2) + 0.5;

    return {
      x: relativeX * MAP_SIZE,
      y: (1 - relativeY) * MAP_SIZE, 
    };
  };

  return (
    <View style={styles.container}>
      {/* Top Bar with current AQI */}
      <View style={styles.topBar}>
        <ThemedText style={styles.aqiText}>
          AQI: {sensors.length > 0 ? Math.round(sensors[0].pm2_5) : '---'}
        </ThemedText>
      </View>

      {/* Minimap with sensor visualization */}
      <View style={styles.minimap}>
        {/* Background grid for reference */}
        <View style={styles.grid} />
        
        {sensors.map((sensor) => {
          const position = getRelativePosition(sensor);
          const opacity = Math.min(sensor.pm2_5 / 50, 1);
          const backgroundColor = `rgba(255, ${Math.max(0, 255 - (sensor.pm2_5 * 10))}, 0, ${opacity})`;

          return (
            <View
              key={sensor.sensor_index}
              style={[
                styles.sensorDot,
                {
                  left: position.x,
                  top: position.y,
                  backgroundColor,
                }
              ]}
            />
          );
        })}
        <View style={styles.currentLocation} />
      </View>

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
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  topBar: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 10,
  },
  aqiText: {
    fontSize: 24,
    color: 'white',
  },
  minimap: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: MAP_SIZE,
    height: MAP_SIZE,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  grid: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sensorDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'white',
    marginLeft: -6,
    marginTop: -6,
  },
  currentLocation: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 8,
    height: 8,
    backgroundColor: '#4285F4',
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
    borderWidth: 1,
    borderColor: 'white',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 10,
  },
  infoText: {
    color: 'white',
    fontSize: 16,
  },
}); 