export interface PurpleAirSensor {
  sensor_index: number;
  latitude: number;
  longitude: number;
  pm2_5: number;  // PM2.5 value
  pm2_5_10minute: number;  // 10-minute average
  pm2_5_30minute: number;  // 30-minute average
  last_seen: number;  // Unix timestamp
}

export interface Location {
  latitude: number;
  longitude: number;
}

export class AirQualityService {
  private readonly API_KEY: string;
  private readonly BASE_URL = 'https://api.purpleair.com/v1';
  
  constructor(apiKey: string) {
    this.API_KEY = apiKey;
  }

  async getNearestSensors(location: Location, radius: number = 500): Promise<PurpleAirSensor[]> {
    try {
      const nwLat = location.latitude + (radius / 111320);
      const seLat = location.latitude - (radius / 111320);
      const nwLng = location.longitude - (radius / (111320 * Math.cos(location.latitude * Math.PI / 180)));
      const seLng = location.longitude + (radius / (111320 * Math.cos(location.latitude * Math.PI / 180)));

      const fields = 'sensor_index,latitude,longitude,pm2.5,pm2.5_10minute,pm2.5_30minute,last_seen';
      const url = `${this.BASE_URL}/sensors?fields=${fields}&nwlat=${nwLat}&selat=${seLat}&nwlng=${nwLng}&selng=${seLng}`;

    //   console.log('Fetching from URL:', url);

      const response = await fetch(url, {
        headers: {
          'X-API-Key': this.API_KEY,
        },
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();

      const sensors = data.data.map((sensorData: any[]) => ({
        sensor_index: sensorData[0],
        last_seen: sensorData[1],
        latitude: sensorData[2],
        longitude: sensorData[3],
        pm2_5: sensorData[4],
        pm2_5_10minute: sensorData[5],
        pm2_5_30minute: sensorData[6]
      }));

      // Filter sensors within exact radius
      const filteredSensors = sensors.filter((sensor: PurpleAirSensor) => {
        const distance = this.calculateDistance(
          location.latitude,
          location.longitude,
          sensor.latitude,
          sensor.longitude
        );
        const isWithinRadius = distance <= radius;
        // console.log(`Sensor at (${sensor.latitude}, ${sensor.longitude}) is ${distance}m away. Within radius: ${isWithinRadius}`);
        return isWithinRadius;
      });

      return filteredSensors;

    } catch (error) {
      console.error('Failed to fetch air quality data:', error);
      throw error;
    }
  }

  // Calculate distance between two points in meters using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Convert PM2.5 value to a normalized value between 0 and 1
  // Based on EPA's AQI breakpoints for PM2.5
  normalizeAQI(pm25: number): number {
    if (pm25 <= 12.0) return pm25 / 12.0 * 0.3; // Good
    if (pm25 <= 35.4) return 0.3 + (pm25 - 12.0) / 23.4 * 0.2; // Moderate
    if (pm25 <= 55.4) return 0.5 + (pm25 - 35.4) / 20 * 0.2; // Unhealthy for Sensitive Groups
    if (pm25 <= 150.4) return 0.7 + (pm25 - 55.4) / 95 * 0.2; // Unhealthy
    if (pm25 <= 250.4) return 0.9 + (pm25 - 150.4) / 100 * 0.1; // Very Unhealthy
    return 1.0; // Hazardous
  }
}

// Create a singleton instance
export const airQualityService = new AirQualityService(process.env.EXPO_PUBLIC_PURPLEAIR_API_KEY || ''); 