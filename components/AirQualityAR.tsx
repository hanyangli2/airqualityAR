import { GLView } from 'expo-gl';
import { WebGLRenderer, PerspectiveCamera, Scene, SphereGeometry, MeshStandardMaterial, Mesh, AmbientLight, DirectionalLight } from 'three';
import { ExpoWebGLRenderingContext } from 'expo-gl';
import * as Location from 'expo-location';
import { DeviceMotion } from 'expo-sensors';
import { PurpleAirSensor } from '../services/AirQualityService';

interface Props {
  sensors: PurpleAirSensor[];
  currentLocation: {
    latitude: number;
    longitude: number;
  };
}

const getAQIColor = (pm25: number): number => {
  if (pm25 <= 12.0) return 0x00ff00; // Green
  if (pm25 <= 35.4) return 0xffff00; // Yellow
  if (pm25 <= 55.4) return 0xff9900; // Orange
  if (pm25 <= 150.4) return 0xff0000; // Red
  if (pm25 <= 250.4) return 0x990066; // Purple
  return 0x660000; // Maroon
};

export function AirQualityAR({ sensors, currentLocation }: Props) {
  console.log('AirQualityAR mounted with:', { 
    sensorCount: sensors.length,
    currentLocation,
  });

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    console.log('GL Context created');
    
    // Initialize Three.js scene
    const scene = new Scene();
    const camera = new PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      2000 // Increased far plane to see distant sensors
    );
    
    // Set up renderer
    const renderer = new WebGLRenderer({ 
      canvas: gl.canvas as any,
      context: gl as any,
      alpha: true 
    });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Add lights
    const ambientLight = new AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Convert GPS to AR coordinates
    function gpsToARCoordinates(sensorLat: number, sensorLong: number): [number, number, number] {
      // Calculate distance and bearing
      const R = 6371000; // Earth's radius in meters
      const lat1 = currentLocation.latitude * Math.PI / 180;
      const lat2 = sensorLat * Math.PI / 180;
      const deltaLat = (sensorLat - currentLocation.latitude) * Math.PI / 180;
      const deltaLong = (sensorLong - currentLocation.longitude) * Math.PI / 180;

      const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLong/2) * Math.sin(deltaLong/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      // Calculate bearing
      const y = Math.sin(deltaLong) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) -
                Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLong);
      const bearing = Math.atan2(y, x);

      // Convert to AR coordinates (X = East/West, Y = Up/Down, Z = North/South)
      const arX = distance * Math.sin(bearing);
      const arZ = -distance * Math.cos(bearing); // Negative because Z is inverted in Three.js
      const arY = 10; // Fixed height above ground

      // Scale down the world (1 meter = 0.1 units in AR)
      return [arX * 0.1, arY, arZ * 0.1];
    }

    // Add debug sphere at origin to verify rendering works
    const debugGeometry = new SphereGeometry(1, 32, 32);
    const debugMaterial = new MeshStandardMaterial({ color: 0xff0000 });
    const debugSphere = new Mesh(debugGeometry, debugMaterial);
    debugSphere.position.set(0, 0, -10); // 10 units in front of camera
    scene.add(debugSphere);
    console.log('Added debug sphere');

    // Create sensor spheres
    sensors.forEach(sensor => {
      const geometry = new SphereGeometry(2, 32, 32);
      const material = new MeshStandardMaterial({
        color: getAQIColor(sensor.pm2_5),
        transparent: true,
        opacity: 0.8,
        emissive: getAQIColor(sensor.pm2_5),
        emissiveIntensity: 0.3,
      });
      const sphere = new Mesh(geometry, material);
      
      // Position the sphere based on GPS coordinates
      const [x, y, z] = gpsToARCoordinates(sensor.latitude, sensor.longitude);
      console.log(`Sensor position calculation:`, {
        sensor: {
          lat: sensor.latitude,
          lng: sensor.longitude,
        },
        arPosition: { x, y, z }
      });
      sphere.position.set(x, y, z);
      
      scene.add(sphere);
    });

    // Position and configure camera
    camera.position.set(0, 1.6, 0); // Average human height
    camera.lookAt(0, 1.6, -1); // Look forward
    console.log('Camera configured:', {
      position: camera.position,
      rotation: camera.rotation
    });

    // Update camera rotation based on device motion
    DeviceMotion.addListener(({ rotation }) => {
      if (rotation) {
        camera.rotation.x = rotation.beta * (Math.PI / 180);
        camera.rotation.y = rotation.gamma * (Math.PI / 180);
        camera.rotation.z = rotation.alpha * (Math.PI / 180);
      }
    });

    // Render loop
    const render = () => {
      requestAnimationFrame(render);
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  };

  return (
    <GLView
      style={{ flex: 1 }}
      onContextCreate={onContextCreate}
    />
  );
} 