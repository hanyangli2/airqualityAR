import { GLView } from 'expo-gl';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Dimensions } from 'react-native';
import * as THREE from 'three';

import { ARBall } from './ar/ARBall';
import { ARArrow } from './ar/ARArrow';
import { PurpleAirSensor } from '@/services/AirQualityService';

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
  pitch?: number;
  onSensorSelect?: (sensorData: PurpleAirSensor) => void;
}

type ViewMode = 'ball' | 'arrow';

export function AirQualityAR({ 
  sensors, 
  currentLocation, 
  heading,
  pitch = 0,
  onSensorSelect,
}: AirQualityARProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('ball');
  const [arObjects, setArObjects] = useState<(ARBall | ARArrow)[]>([]);
  const [scene] = useState(() => new THREE.Scene());
  const [camera] = useState(() => {
    const cam = new THREE.PerspectiveCamera(75, 1, 0.1, 3000);
    cam.position.set(0, 0, 0);
    return cam;
  });

  const headingRef = useRef(heading);
  const pitchRef = useRef(pitch);

  const raycaster = new THREE.Raycaster();
  const touchPosition = new THREE.Vector2();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.Camera>();

  useEffect(() => {
    headingRef.current = heading;
    pitchRef.current = pitch;
  }, [heading, pitch]);

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

    const newObjects = sensors.map(sensor => 
      viewMode === 'ball' ? new ARBall(sensor) : new ARArrow(sensor)
    );

    setArObjects(newObjects);

    newObjects.forEach(obj => {
      scene.add(obj.getMesh());
    });

    return () => {
      newObjects.forEach(obj => {
        scene.remove(obj.getMesh());
      });
    };
  }, [sensors, scene, viewMode]);

  useEffect(() => {
    if (currentLocation) {
      arObjects.forEach(obj => {
        obj.update(currentLocation);
      });
    }
  }, [currentLocation, arObjects]);

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
      const currentPitch = pitchRef.current;

      camera.rotation.y = THREE.MathUtils.degToRad(-currentHeading);
      camera.rotation.x = THREE.MathUtils.degToRad(-currentPitch);
      
      const cameraDir = new THREE.Vector3();
      camera.getWorldDirection(cameraDir);

      arObjects.forEach(obj => {
        const objPos = new THREE.Vector3();
        obj.getMesh().getWorldPosition(objPos);
        
        const toObj = objPos.clone().sub(camera.position).normalize();
        
        const dotProduct = cameraDir.dot(toObj);
        
        const verticalAngle = Math.atan2(objPos.y - camera.position.y, 
          Math.sqrt(Math.pow(objPos.x - camera.position.x, 2) + 
                   Math.pow(objPos.z - camera.position.z, 2)));
        
        const fovY = THREE.MathUtils.degToRad(camera.fov);
        const inVerticalFOV = Math.abs(verticalAngle + THREE.MathUtils.degToRad(currentPitch)) < fovY/2;
        
        obj.getMesh().visible = dotProduct > 0 && inVerticalFOV;

        if (frameCount % 60 === 0) {
          console.log(`Object ${obj.getMesh().name} state:`, {
            position: objPos.toArray(),
            dotProduct,
            verticalAngle: THREE.MathUtils.radToDeg(verticalAngle),
            pitch: currentPitch,
            visible: obj.getMesh().visible,
            heading: currentHeading
          });
        }
      });

      if (frameCount % 60 === 0 || lastLoggedHeading !== currentHeading) {
        console.log('Render loop state:', {
          heading: currentHeading,
          pitch: currentPitch,
          cameraRotation: camera.rotation.toArray(),
          cameraDirection: cameraDir.toArray()
        });
        lastLoggedHeading = currentHeading;
      }
      
      frameCount++;
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();

    sceneRef.current = scene;
    cameraRef.current = camera;
  };

  const handleTouch = (event: any) => {
    if (!sceneRef.current || !cameraRef.current) return;

    const touch = event.nativeEvent;
    touchPosition.x = (touch.locationX / Dimensions.get('window').width) * 2 - 1;
    touchPosition.y = -(touch.locationY / Dimensions.get('window').height) * 2 + 1;

    raycaster.setFromCamera(touchPosition, cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

    if (intersects.length > 0) {
      const selectedObject = intersects[0].object;
      if (selectedObject.userData?.type === 'sensor') {
        onSensorSelect?.(selectedObject.userData.sensorData);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={handleTouch}
        style={StyleSheet.absoluteFill}
      >
        <GLView
          style={StyleSheet.absoluteFill}
          onContextCreate={onContextCreate}
        />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={() => setViewMode(current => current === 'ball' ? 'arrow' : 'ball')}
      >
        <Text style={styles.toggleText}>
          {viewMode === 'ball' ? '🔄 Switch to Arrows' : '🔄 Switch to Balls'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1,
  },
  toggleText: {
    color: 'white',
    fontSize: 16,
  },
});
