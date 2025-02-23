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
    
    this.arrow.userData = {
      type: 'sensor',
      sensorData: this.sensorData
    };

    this.arrow.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData = {
          type: 'sensor',
          sensorData: this.sensorData
        };
      }
    });
  }

  private createArrow(): THREE.Group {
    const arrowGroup = new THREE.Group();
    
    const shaftGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const shaftMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(getAQIColor(this.sensorData.pm2_5))
    });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.rotation.x = Math.PI / 2;
    
    const headGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
    const headMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(getAQIColor(this.sensorData.pm2_5))
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.z = 0.7;
    head.rotation.x = Math.PI / 2;
    
    arrowGroup.add(shaft);
    arrowGroup.add(head);

    arrowGroup.name = `arrow-${this.sensorData.sensor_index}`;
    
    return arrowGroup;
  }

  public getMesh(): THREE.Group {
    return this.arrow;
  }

  public update(
    userLocation: { latitude: number; longitude: number },
    radius: number = 2
  ) {
    const dLat = this.sensorData.latitude - userLocation.latitude;
    const dLon = this.sensorData.longitude - userLocation.longitude;
    
    const sensorBearing = Math.atan2(dLon, dLat);
    
    this.arrow.position.set(
      Math.sin(sensorBearing) * radius,
      -1, 
      -Math.cos(sensorBearing) * radius
    );
    
    this.arrow.rotation.y = sensorBearing + Math.PI + Math.PI / 2 - Math.PI / 2 - Math.PI / 2 + 0.175;

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

  public getSensorData() {
    return this.sensorData;
  }
} 