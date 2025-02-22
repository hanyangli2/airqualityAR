// AirQualityWidget.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AirQualityWidget = ({ aqi, temperature, humidity }) => {
  // Determine style based on AQI value (dummy logic; update as needed)
  let backgroundColor = '#4CAF50'; // green for good
  let iconName = 'weather-sunny';  // icon for good air
  let aqiLabel = 'Good';

  if (aqi > 100) {
    backgroundColor = '#F44336'; // red for bad
    iconName = 'smog';
    aqiLabel = 'Poor';
  } else if (aqi > 50) {
    backgroundColor = '#FFEB3B'; // yellow for moderate
    iconName = 'weather-hazy';
    aqiLabel = 'Moderate';
  }

  return (
    <Card style={[styles.card, { backgroundColor }]}>
      <Card.Content>
        <Title style={styles.title}>Air Quality: {aqi} ({aqiLabel})</Title>
        <View style={styles.row}>
          <Icon name={iconName} size={40} color="#fff" />
          <Paragraph style={styles.info}>
            Temp: {temperature}°C  |  Humidity: {humidity}%
          </Paragraph>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 8,
    elevation: 4,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  info: {
    color: '#fff',
    marginLeft: 16,
    fontSize: 16,
  },
});

export default AirQualityWidget;
