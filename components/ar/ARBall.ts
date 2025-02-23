import * as THREE from 'three';
import { getAQIColor } from '@/utils/aqi';

export class ARBall {
  private ball: THREE.Mesh;
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
    this.ball = this.createBall();
    
    this.ball.userData = {
      type: 'sensor',
      sensorData: this.sensorData
    };
  }

  private createBall(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(getAQIColor(this.sensorData.pm2_5))
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = `ball-${this.sensorData.sensor_index}`;
    return sphere;
  }

  public getMesh(): THREE.Mesh {
    return this.ball;
  }

  private computeDistance(loc1: { latitude: number; longitude: number }, 
                        loc2: { latitude: number; longitude: number }): number {
    const R = 6371e3; 
    const φ1 = loc1.latitude * Math.PI/180;
    const φ2 = loc2.latitude * Math.PI/180;
    const Δφ = (loc2.latitude - loc1.latitude) * Math.PI/180;
    const Δλ = (loc2.longitude - loc1.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  public update(
    userLocation: { latitude: number; longitude: number },
    scaleFactor: number = 1/10 
  ) {
    const realDistance = this.computeDistance(userLocation, this.sensorData);
    
    const radius = realDistance * scaleFactor;
    
    const dLat = this.sensorData.latitude - userLocation.latitude;
    const dLon = this.sensorData.longitude - userLocation.longitude;

    const sensorBearing = Math.atan2(dLon, dLat);

    const altitude = Math.min(radius * 0.2, 20); 

    this.ball.position.set(
      Math.sin(sensorBearing) * radius,
      altitude,
      -Math.cos(sensorBearing) * radius
    );

    console.log(`Ball ${this.sensorData.sensor_index} update:`, {
      bearing: THREE.MathUtils.radToDeg(sensorBearing),
      realDistance,
      scaledDistance: radius,
      altitude,
      position: this.ball.position.toArray(),
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