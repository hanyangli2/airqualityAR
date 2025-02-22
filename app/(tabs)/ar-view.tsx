import { StyleSheet } from 'react-native';
import { GLView } from 'expo-gl';
import { Camera, CameraView } from 'expo-camera';
import * as THREE from 'three';
import { useState, useEffect } from 'react';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function ARViewScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

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
            const scene = new THREE.Scene();
            scene.background = null;
            
            const camera = new THREE.PerspectiveCamera(
              75,
              gl.drawingBufferWidth / gl.drawingBufferHeight,
              0.1,
              1000
            );
            camera.position.z = 5;

            const renderer = new THREE.WebGLRenderer({
              context: gl,
              canvas: gl.canvas,
              alpha: true,
            });
            renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
            renderer.setClearColor(0x000000, 0);

            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshPhongMaterial({ 
              color: 0xff00ff,
              opacity: 0.8,
              transparent: true
            });
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(0, 1, 5);
            scene.add(directionalLight);

            function animate() {
              requestAnimationFrame(animate);

              cube.rotation.x += 0.02;
              cube.rotation.y += 0.02;

              renderer.render(scene, camera);
              gl.endFrameEXP();
            }

            animate();
          }}
        />
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