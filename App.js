import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import NotesListScreen from './src/screens/NotesListScreen';
import TodoScreen from './src/screens/TodoScreen';

const Stack = createNativeStackNavigator();

function NoteEditorScreenWrapper(props) {
  const Screen = require('./src/screens/NoteEditorScreen').default;
  return <Screen {...props} />;
}

function OCRScreenWrapper(props) {
  const Screen = require('./src/screens/OCRScreen').default;
  return <Screen {...props} />;
}

function AppNavigator() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="NotesList" component={NotesListScreen} />
          <Stack.Screen name="NoteEditor" component={NoteEditorScreenWrapper} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Todo" component={TodoScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="OCR" component={OCRScreenWrapper} options={{ animation: 'slide_from_bottom' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const mainFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    const looping = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 0.92, duration: 800, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.75, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
        ]),
      ])
    );

    looping.start();

    const timer = setTimeout(() => {
      Animated.timing(mainFade, { toValue: 1, duration: 600, useNativeDriver: true }).start(() => {
        setIsLoading(false);
        looping.stop();
      });
    }, 1400);

    return () => {
      clearTimeout(timer);
      looping.stop();
    };
  }, [mainFade, opacityAnim, pulseAnim]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <View style={{ flex: 1 }}>
          <Animated.View style={{ flex: 1, opacity: mainFade }}>
            <AppNavigator />
          </Animated.View>

          {isLoading && (
            <View style={styles.splashContainer}>
              <Animated.Image
                source={require('./assets/icon.png')}
                style={[
                  styles.logo,
                  { transform: [{ scale: pulseAnim }], opacity: opacityAnim },
                ]}
                resizeMode="contain"
              />
              <Text style={styles.title}>Royal Notes</Text>
              <Text style={styles.tagline}>Your ideas deserve a throne.</Text>
            </View>
          )}
        </View>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 220,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    letterSpacing: 2,
    marginTop: 20,
    fontFamily: 'serif',
  },
  tagline: {
    color: '#9A9A9A',
    fontSize: 13,
    letterSpacing: 1.5,
    marginTop: 8,
    fontFamily: 'serif',
  },
});
