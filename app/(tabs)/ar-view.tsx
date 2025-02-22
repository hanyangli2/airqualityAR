import { StyleSheet, Text } from 'react-native';
import { GLView } from 'expo-gl';
import { Camera, CameraView } from 'expo-camera';
import * as THREE from 'three';
import { useState, useEffect } from 'react';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AirQualityHUD } from '@/components/AirQualityHUD';

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

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

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
        <GLView
          style={StyleSheet.absoluteFill}
          onContextCreate={async (gl) => {
            try {
              global.document.createElement = () => ({
                style: {},
                addEventListener: () => {},
                removeEventListener: () => {},
                clientWidth: gl.drawingBufferWidth,
                clientHeight: gl.drawingBufferHeight,
              });

              if (global.window === undefined) {
                global.window = {
                  innerWidth: gl.drawingBufferWidth,
                  innerHeight: gl.drawingBufferHeight,
                  devicePixelRatio: 1,
                  addEventListener: () => {},
                };
              }

              console.log("GL Context Created");
              setDebugInfo(prev => ({ ...prev, glReady: true }));

              const scene = new THREE.Scene();
              console.log("Scene Created");
              setDebugInfo(prev => ({ ...prev, sceneCreated: true }));
              
              const camera = new THREE.PerspectiveCamera(
                75,
                gl.drawingBufferWidth / gl.drawingBufferHeight,
                0.1,
                1000
              );
              camera.position.z = 2;
              camera.position.y = 1;
              camera.lookAt(0, 0, 0);

              const renderer = new THREE.WebGLRenderer({
                context: gl,
                canvas: gl.canvas,
                alpha: true,
              });
              renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
              renderer.setClearColor(0x000000, 0);

              const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
              const material = new THREE.MeshPhongMaterial({ 
                color: 0xff0000,
                shininess: 100,
                emissive: 0xff0000,
                emissiveIntensity: 0.5,
              });
              const cube = new THREE.Mesh(geometry, material);
              scene.add(cube);

              const edges = new THREE.EdgesGeometry(geometry);
              const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
              const wireframe = new THREE.LineSegments(edges, lineMaterial);
              cube.add(wireframe);

              const ambientLight = new THREE.AmbientLight(0xffffff, 1);
              scene.add(ambientLight);
              
              const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
              directionalLight.position.set(1, 1, 1);
              scene.add(directionalLight);

              // Create a plane that will cover the upper portion of the screen
              const skyPlaneGeometry = new THREE.PlaneGeometry(2, 1); // Width of 2 units, height of 1 unit
              const skyMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00ff00, // Green color for good air quality
                transparent: true,
                opacity: 0.3, // Semi-transparent
              });
              const skyPlane = new THREE.Mesh(skyPlaneGeometry, skyMaterial);
              // Position the plane in the upper half of the view
              skyPlane.position.z = -1; // Place it behind other elements
              skyPlane.position.y = 0.5; // Move it up
              scene.add(skyPlane);

              let frameId: number | null = null;
              const animate = () => {
                try {
                  frameId = requestAnimationFrame(animate);
                  
                  cube.rotation.x += 0.02;
                  cube.rotation.y += 0.02;

                  renderer.render(scene, camera);
                  gl.endFrameEXP();

                  setDebugInfo(prev => ({ 
                    ...prev, 
                    renderCalled: prev.renderCalled + 1 
                  }));
                } catch (error: any) {
                  console.error("Animation error:", error);
                  setDebugInfo(prev => ({ 
                    ...prev, 
                    error: error?.toString() || "Animation error" 
                  }));
                }
              };

              console.log("Starting animation");
              animate();

              return () => {
                if (frameId != null) {
                  cancelAnimationFrame(frameId);
                }
              };
            } catch (error: any) {
              console.error("Setup error:", error);
              setDebugInfo(prev => ({ 
                ...prev, 
                error: error?.toString() || "Setup error" 
              }));
            }
          }}
        />
        <AirQualityHUD />
        
        <Text style={{
          position: 'absolute',
          top: 50,
          left: 10,
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: 10,
        }}>
          GL Ready: {debugInfo.glReady ? 'Yes' : 'No'}{'\n'}
          Scene Created: {debugInfo.sceneCreated ? 'Yes' : 'No'}{'\n'}
          Render Count: {debugInfo.renderCalled}{'\n'}
          {debugInfo.error && `Error: ${debugInfo.error}`}
        </Text>
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