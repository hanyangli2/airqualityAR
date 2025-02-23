import { Image, StyleSheet, Platform, Animated, View, Easing, Text } from 'react-native';
import { useRef, useEffect } from 'react';
import { Card, Title, Paragraph } from 'react-native-paper';
import { Svg, Rect, Text as SVGText, G } from 'react-native-svg';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol.ios';
import AirQualityWidget from '../AirQualityWidget';

export default function HomeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const cloudShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cloudShake, {
          toValue: 7,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(cloudShake, {
          toValue: -7,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);
  useEffect(() => {
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 1500,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, []);

  const AQILevels = [
    { level: 'Good', color: '#00E400', range: '0-50' },
    { level: 'Moderate', color: '#FFFF00', range: '51-100' },
    { level: 'Unhealthy for Sensitive Groups', color: '#FF7E00', range: '101-150' },
    { level: 'Unhealthy', color: '#FF0000', range: '151-200' },
    { level: 'Very Unhealthy', color: '#8F3F97', range: '201-300' },
    { level: 'Hazardous', color: '#7E0023', range: '301-500' },
  ];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <View style={styles.header}>
          <Image source={require('@/assets/images/sky-background-skyline.png')} style={styles.headerBackground} />
          <Animated.Image 
            source={require('@/assets/images/clouds-.png')} 
            style={[styles.cloud1, { transform: [{ translateX: cloudShake }] }]} 
          />
          <Animated.Image 
            source={require('@/assets/images/clouds-.png')} 
            style={[styles.cloud2, { transform: [{ translateX: cloudShake }] }]} 
          />
          <Animated.Image 
            source={require('@/assets/images/clouds-.png')} 
            style={[styles.cloud3, { transform: [{ translateX: cloudShake }] }]} 
          />
          <Animated.Image 
            source={require('@/assets/images/clouds-.png')} 
            style={[styles.cloud4, { transform: [{ translateX: cloudShake }] }]} 
          />
         <View style={styles.headerTextContainer}>
          <Animated.Text style={[styles.headerText, { opacity: titleOpacity }]}>
            Air Quality <Text style={styles.highlight}>AR</Text>
          </Animated.Text>
        </View>
        </View>
      }
    >      

        {/* <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Welcome!</ThemedText>
          <HelloWave />
        </ThemedView> */}
 
  <AirQualityWidget />

      <Card style={styles.aqiLegendCard}>
        <Card.Content>
          <Title style={styles.aqiLegendTitle}>AQI Key</Title>
          <Svg height="150" width="100%">
              {AQILevels.map((item, index) => (
                <G key={index}> {/* Wrap elements in a `<g>` and assign the key */}
                  <Rect x={10} y={index * 25} width={20} height={20} fill={item.color} />
                  <SVGText x={40} y={index * 25 + 15} fontSize="14" fill="black">
                    {item.range} - {item.level}
                  </SVGText>
                </G>
              ))}
            </Svg>

        </Card.Content>
      </Card>
      </ParallaxScrollView>
      );
      }

const styles = StyleSheet.create({
  titleContainer: {
    gap: 8,
    zIndex: 1,
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  header: {
    height: 250,
    width: '100%',
    position: 'relative',
  },
  headerBackground: {
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
  headerTextContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  headerText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 8,
    letterSpacing: 2,
  },
  highlight: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  
  aqiLegendCard: {
    margin: 20,
    padding: 10,
    borderRadius: 10,
    elevation: 5,
    backgroundColor: '#fff',
  },
  aqiLegendTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },

  cloud1: {
    position: 'absolute',
    width: 75,
    height: 40,
    top: 50,
    left: 20,
    opacity: 0.8,
  },
  cloud2: {
    position: 'absolute',
    width: 75,
    height: 40,
    top: 90,
    left: 200,
    opacity: 0.8,
  },
  cloud3: {
    position: 'absolute',
    width: 60,
    height: 30,
    top: 130,
    left: 80,
    opacity: 0.7,
  },
  cloud4: {
    position: 'absolute',
    width: 75,
    height: 50,
    top: 150,
    left: 300,
    opacity: 0.7,
  },
  skyline: {
    position: 'absolute',
    width: 300,
    height: 100,
    top: 100,
    opacity: 0.7,
  },
  
});
