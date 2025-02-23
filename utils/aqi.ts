export function getAQIColor(pm25: number): string {
  // EPA AQI breakpoints for PM2.5
  if (pm25 <= 12.0) return '#00e400'; // Good - Green
  if (pm25 <= 35.4) return '#ffff00'; // Moderate - Yellow
  if (pm25 <= 55.4) return '#ff7e00'; // Unhealthy for Sensitive Groups - Orange
  if (pm25 <= 150.4) return '#ff0000'; // Unhealthy - Red
  if (pm25 <= 250.4) return '#8f3f97'; // Very Unhealthy - Purple
  return '#7e0023'; // Hazardous - Maroon
} 