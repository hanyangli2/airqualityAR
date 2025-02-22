import { StyleSheet, Text } from 'react-native';
import { GLView } from 'expo-gl';
import { Camera, CameraView } from 'expo-camera';
import * as THREE from 'three';
import { useState, useEffect } from 'react';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AirQualityHUD } from '@/components/AirQualityHUD';
import { AirQualityAR } from '@/components/AirQualityAR';

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
  const [debugInfo, setDebugInfo] = useState({
    glReady: false,
    sceneCreated: false,
    renderCalled: 0,
    error: null as string | null,
  });
  const [sensors, setSensors] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    console.log('Current sensors and location:', {
      sensorCount: sensors.length,
      currentLocation
    });
  }, [sensors, currentLocation]);

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
          />
        )}
        <AirQualityHUD />
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