import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import { ThemedText } from './ThemedText';
import { airQualityService, PurpleAirSensor } from '../services/AirQualityService';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';
import { DeviceMotion } from 'expo-sensors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_SIZE = SCREEN_WIDTH * 0.3;

interface AirQualityHUDProps {
  sensors: PurpleAirSensor[];
  currentLocation: {latitude: number, longitude: number} | null;
  heading: number;
  locationError: string | null;
}

export function AirQualityHUD({ sensors, currentLocation, heading, locationError }: AirQualityHUDProps) {
  // Remove all the useEffects and states that are now handled by the parent
  
  // Show error or loading state if location isn't available
  if (locationError) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <ThemedText style={styles.aqiText}>Location Error: {locationError}</ThemedText>
        </View>
      </View>
    );
  }

  if (!currentLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <ThemedText style={styles.aqiText}>Getting location...</ThemedText>
        </View>
      </View>
    );
  }

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

  const getAQIColor = (pm2_5: number) => {
    if (pm2_5 < 12.1) return 'rgb(0, 255, 0)';
    if (pm2_5 < 35.5) return 'rgb(255, 255, 0)';
    if (pm2_5 < 55.5) return 'rgb(255, 128, 0)';
    if (pm2_5 < 150.5) return 'rgb(255, 0, 0)';
    return 'rgb(128, 0, 0)';
  };

  return (
    <View style={styles.container}>
      {/* Removed topBar View */}

      {/* Fixed minimap container */}
      <View style={styles.minimap}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: currentLocation?.latitude ?? 38.03154,
            longitude: currentLocation?.longitude ?? -78.51061,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          camera={{
            center: {
              latitude: currentLocation?.latitude ?? 38.03154,
              longitude: currentLocation?.longitude ?? -78.51061,
            },
            pitch: 0,
            heading: heading,
            altitude: 1000,
            zoom: 15
          }}
          pitchEnabled={false}
          rotateEnabled={true}
          scrollEnabled={false}
          zoomEnabled={false}
        />
        
        <View style={[
          styles.mapOverlay,
          { transform: [{ rotate: `${-heading}deg` }] }
        ]}>
          {sensors.map((sensor) => {
            const position = getRelativePosition(sensor);
            const color = getAQIColor(sensor.pm2_5);
            
            return (
              <View
                key={sensor.sensor_index}
                style={[
                  styles.sensorContainer,
                  {
                    left: position.x,
                    top: position.y,
                    transform: [{ rotate: `${heading}deg` }]  // Rotate sensors back to match map
                  }
                ]}
              >
                <View style={[styles.sensorGradientRing, { backgroundColor: color }]} />
                <View style={[styles.sensorDot, { backgroundColor: color }]} />
              </View>
            );
          })}
          <View style={styles.currentLocation} />
        </View>
      </View>

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
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  sensorContainer: {
    position: 'absolute',
    width: 40,  // Larger container for gradient effect
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorGradientRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    opacity: 0.3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sensorDot: {
    position: 'absolute',
    width: 8,  // Small center dot
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'white',
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
  mapOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
}); 