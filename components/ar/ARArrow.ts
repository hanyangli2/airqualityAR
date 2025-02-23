import * as THREE from 'three';
import { getAQIColor } from '@/utils/aqi';

export class ARArrow {
  private arrow: THREE.Group;
  private sensorData: {
    latitude: number;
    longitude: number;
    pm2_5: number;
    sensor_index: number;
  };

  constructor(sensorData: {
    latitude: number;
    longitude: number;
    pm2_5: number;
    sensor_index: number;
  }) {
    this.sensorData = sensorData;
    this.arrow = this.createArrow();
  }

  private createArrow(): THREE.Group {
    const arrowGroup = new THREE.Group();
    
    // Create the arrow shaft (tail)
    const shaftGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const shaftMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(getAQIColor(this.sensorData.pm2_5))
    });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    // Rotate so that the shaft points along positive z (default forward)
    shaft.rotation.x = Math.PI / 2;
    
    // Create the arrow head (tip)
    const headGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
    const headMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(getAQIColor(this.sensorData.pm2_5))
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.z = 0.7;
    head.rotation.x = Math.PI / 2;
    
    arrowGroup.add(shaft);
    arrowGroup.add(head);

    // Add debug name
    arrowGroup.name = `arrow-${this.sensorData.sensor_index}`;
    
    return arrowGroup;
  }

  public getMesh(): THREE.Group {
    return this.arrow;
  }

  /**
   * Update the arrow's position and rotation based solely on the sensor's bearing relative to the user.
   * The arrow stays fixed in world space, independent of device heading.
   */
  public update(
    userLocation: { latitude: number; longitude: number },
    radius: number = 2
  ) {
    // Compute differences in coordinates
    const dLat = this.sensorData.latitude - userLocation.latitude;
    const dLon = this.sensorData.longitude - userLocation.longitude;
    
    // Calculate bearing in radians (0 = north, increasing clockwise)
    const sensorBearing = Math.atan2(dLon, dLat);
    
    // Position the arrow on a fixed ring around the user
    this.arrow.position.set(
      Math.sin(sensorBearing) * radius,
      -1,  // Lower the arrows 1 unit below eye level
      -Math.cos(sensorBearing) * radius
    );
    
    // Rotate the arrow to point toward the sensor
    this.arrow.rotation.y = sensorBearing + Math.PI;

    // Debug logging
    console.log(`Arrow ${this.sensorData.sensor_index} update:`, {
      bearing: THREE.MathUtils.radToDeg(sensorBearing),
      rotation: THREE.MathUtils.radToDeg(this.arrow.rotation.y),
      position: this.arrow.position.toArray(),
      sensorLocation: {
        lat: this.sensorData.latitude,
        lon: this.sensorData.longitude
      }
    });
  }
} 