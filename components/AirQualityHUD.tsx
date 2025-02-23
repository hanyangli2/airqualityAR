import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Dimensions, Platform, TouchableOpacity, Animated } from 'react-native';
import { ThemedText } from './ThemedText';
import { airQualityService, PurpleAirSensor } from '../services/AirQualityService';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';
import { DeviceMotion } from 'expo-sensors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const COMPACT_MAP_SIZE = SCREEN_WIDTH * 0.3;
const EXPANDED_MAP_SIZE = Math.min(SCREEN_WIDTH * 0.9, SCREEN_HEIGHT * 0.7);

interface AirQualityHUDProps {
  sensors: PurpleAirSensor[];
  currentLocation: {latitude: number, longitude: number} | null;
  heading: number;
  locationError: string | null;
}

export function AirQualityHUD({ sensors, currentLocation, heading, locationError }: AirQualityHUDProps) {
  const [expanded, setExpanded] = useState(false);
  const [mapSize] = useState(new Animated.Value(COMPACT_MAP_SIZE));
  const [opacity] = useState(new Animated.Value(0));

  const toggleExpanded = useCallback(() => {
    const newSize = expanded ? COMPACT_MAP_SIZE : EXPANDED_MAP_SIZE;
    
    Animated.parallel([
      Animated.spring(mapSize, {
        toValue: newSize,
        useNativeDriver: false,
        friction: 8,
        tension: 40
      }),
      Animated.timing(opacity, {
        toValue: expanded ? 0 : 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();

    setExpanded(!expanded);
  }, [expanded, mapSize, opacity]);

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
    // Get the current map size value
    const currentMapSize = expanded ? EXPANDED_MAP_SIZE : COMPACT_MAP_SIZE;
    
    // Calculate the visible region bounds based on the map's current state
    const latDelta = expanded ? 0.05 : 0.02;
    const lngDelta = expanded ? 0.05 : 0.02;
    
    // Calculate the relative position within the visible region
    const relativeX = (sensor.longitude - (currentLocation?.longitude ?? 0)) / lngDelta + 0.5;
    const relativeY = (sensor.latitude - (currentLocation?.latitude ?? 0)) / latDelta + 0.5;

    return {
      x: relativeX * currentMapSize,
      y: (1 - relativeY) * currentMapSize,
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
    <View style={styles.container} pointerEvents="box-none">
      <TouchableOpacity 
        style={[
          styles.minimapContainer,
          expanded && styles.expandedMinimapContainer
        ]}
        onPress={toggleExpanded}
        activeOpacity={0.9}
      >
        <Animated.View style={[
          styles.minimap,
          {
            width: mapSize,
            height: mapSize,
          }
        ]}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: currentLocation?.latitude ?? 38.03154,
              longitude: currentLocation?.longitude ?? -78.51061,
              latitudeDelta: expanded ? 0.05 : 0.02,
              longitudeDelta: expanded ? 0.05 : 0.02,
            }}
            camera={{
              center: {
                latitude: currentLocation?.latitude ?? 38.03154,
                longitude: currentLocation?.longitude ?? -78.51061,
              },
              pitch: 0,
              heading: heading,
              altitude: 1000,
              zoom: expanded ? 13 : 15
            }}
            pitchEnabled={false}
            rotateEnabled={true}
            scrollEnabled={expanded}
            zoomEnabled={expanded}
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
                      transform: [
                        { rotate: `${heading}deg` },
                        { scale: expanded ? 1.5 : 1 }
                      ]
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

          {/* Additional info when expanded */}
          <Animated.View style={[styles.expandedInfo, { opacity }]}>
            <View style={styles.expandedHeader}>
              <ThemedText style={styles.expandedTitle}>Air Quality Overview</ThemedText>
              <ThemedText style={styles.expandedSubtitle}>
                {sensors.length} Sensors Nearby
              </ThemedText>
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#00e400' }]} />
                <ThemedText style={styles.legendText}>Good</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ffff00' }]} />
                <ThemedText style={styles.legendText}>Moderate</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ff7e00' }]} />
                <ThemedText style={styles.legendText}>Unhealthy</ThemedText>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.bottomPanel}>
        <ThemedText style={styles.infoText}>
          Tap map to {expanded ? 'minimize' : 'expand'}
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
  minimapContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedMinimapContainer: {
    right: (SCREEN_WIDTH - EXPANDED_MAP_SIZE) / 2,
    bottom: (SCREEN_HEIGHT - EXPANDED_MAP_SIZE) / 2,
  },
  minimap: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
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
  expandedInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  expandedHeader: {
    marginBottom: 10,
  },
  expandedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  expandedSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    color: 'white',
    fontSize: 12,
  },
}); 