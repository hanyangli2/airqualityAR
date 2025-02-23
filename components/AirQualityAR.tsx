import { GLView } from 'expo-gl';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import * as THREE from 'three';

import { ARArrow } from './ar/ARArrow';
import { PurpleAirSensor } from '@/services/AirQualityService';

// Extend WebGLRenderingContext to include Expo-specific methods
interface ExpoWebGLRenderingContext extends WebGLRenderingContext {
  endFrameEXP: () => void;
}

interface AirQualityARProps {
  sensors: PurpleAirSensor[];
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  heading: number;
}

export function AirQualityAR({ sensors, currentLocation, heading }: AirQualityARProps) {
  const [arArrows, setArArrows] = useState<ARArrow[]>([]);
  const [scene] = useState(() => new THREE.Scene());
  const [camera] = useState(() => {
    const cam = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    cam.position.set(0, 0, 0); // Camera at the origin at eye level
    return cam;
  });

  // Create a ref to store the current heading
  const headingRef = useRef(heading);

  // Update the ref whenever heading changes
  useEffect(() => {
    headingRef.current = heading;
    console.log('Heading updated:', heading);
  }, [heading]);

  // Debug: Log when sensors change
  useEffect(() => {
    console.log('Sensors updated:', {
      count: sensors.length,
      sensorIds: sensors.map(s => s.sensor_index),
      sensorLocations: sensors.map(s => ({
        id: s.sensor_index,
        lat: s.latitude,
        lon: s.longitude
      }))
    });
  }, [sensors]);

  useEffect(() => {
    // Create arrows for each sensor
    const newArrows = sensors.map(sensor => new ARArrow(sensor));
    
    // Debug: Log arrow creation
    console.log('Creating arrows:', {
      arrowCount: newArrows.length,
      sensorIds: sensors.map(s => s.sensor_index)
    });

    setArArrows(newArrows);

    // Add arrows to the scene
    newArrows.forEach(arrow => {
      scene.add(arrow.getMesh());
    });

    return () => {
      // Cleanup: remove arrows from scene
      newArrows.forEach(arrow => {
        scene.remove(arrow.getMesh());
      });
    };
  }, [sensors, scene]);

  // Update arrow positions when location changes
  useEffect(() => {
    if (currentLocation) {
      arArrows.forEach(arrow => {
        arrow.update(currentLocation);
      });
    }
  }, [currentLocation, arArrows]);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const renderer = new THREE.WebGLRenderer({
      canvas: gl.canvas as any,
      context: gl,
      alpha: true,
    });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    
    camera.aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    camera.updateProjectionMatrix();

    console.log('Camera settings:', {
      fov: camera.fov,
      aspect: camera.aspect,
      near: camera.near,
      far: camera.far,
      position: camera.position.toArray()
    });

    let frameCount = 0;
    let lastLoggedHeading = headingRef.current;
    
    const render = () => {
      requestAnimationFrame(render);
      
      const currentHeading = headingRef.current;
      camera.rotation.y = THREE.MathUtils.degToRad(-currentHeading);
      
      const cameraDir = new THREE.Vector3();
      camera.getWorldDirection(cameraDir);

      if (frameCount % 60 === 0 || lastLoggedHeading !== currentHeading) {
        console.log('Render loop state:', {
          heading: currentHeading,
          cameraRotation: camera.rotation.y,
          cameraDirection: cameraDir.toArray()
        });
        lastLoggedHeading = currentHeading;
      }
      
      arArrows.forEach(arrow => {
        const arrowWorldPos = new THREE.Vector3();
        arrow.getMesh().getWorldPosition(arrowWorldPos);
        const toArrow = arrowWorldPos.clone().sub(camera.position).normalize();
        
        // Calculate dot product here
        const dotProduct = cameraDir.dot(toArrow);
        
        // Use dot product for visibility
        arrow.getMesh().visible = dotProduct > 0;

        if (frameCount % 60 === 0) {
          console.log(`Arrow ${arrow.getMesh().name} state:`, {
            position: arrowWorldPos.toArray(),
            dotProduct,
            visible: arrow.getMesh().visible,
            heading: currentHeading
          });
        }
      });
      
      frameCount++;
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  };

  return (
    <GLView
      style={StyleSheet.absoluteFill}
      onContextCreate={onContextCreate}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
