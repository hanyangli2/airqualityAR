import { Image, StyleSheet, Platform, Animated, View, Easing } from 'react-native';
import { useRef, useEffect } from 'react';
import { Card, Title, Paragraph } from 'react-native-paper';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol.ios';
import AirQualityWidget from '../AirQualityWidget';

export default function HomeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
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
          <View 
            style={styles.headerTextContainer}>
            <ThemedText 
              type="headerTitle">Air Quality AR
            </ThemedText>
          </View>
        </View>
      }
    >      

        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Welcome!</ThemedText>
          <HelloWave />
        </ThemedView>

        <AirQualityWidget aqi={75} temperature={22} humidity={65} />

        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Step 1: Try it</ThemedText>
          <ThemedText>
            Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
            Press{' '}
            <ThemedText type="defaultSemiBold">
              {Platform.select({ ios: 'cmd + d', android: 'cmd + m', web: 'F12' })}
            </ThemedText>{' '}
            to open developer tools.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Current Air Quality</ThemedText>
          <ThemedText>🌡 Temperature: 22°C</ThemedText>
          <ThemedText>💧 Humidity: 65%</ThemedText>
        </ThemedView>

        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
          <ThemedText>
            When you're ready, run <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
            <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
            <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
            <ThemedText type="defaultSemiBold">app-example</ThemedText>.
          </ThemedText>
        </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    gap: 8,
    zIndex: 1, // ensure it renders above the header image
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
  headerTextContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center', // center vertically
    alignItems: 'center', // center horizontally
    zIndex: 2, // ensure it’s on top of the images
  },
});
