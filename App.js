import 'react-native-gesture-handler';

import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Video, ResizeMode } from 'expo-av';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import NotesListScreen from './src/screens/NotesListScreen';
import TodoScreen from './src/screens/TodoScreen';

const Stack = createNativeStackNavigator();

function NativeModuleFallback({ navigation, title, error }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.fallbackScreen, { backgroundColor: isDark ? '#050505' : '#F6F2E8' }]}>
      <View style={[styles.fallbackCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.fallbackEyebrow, { color: colors.accent }]}>SCREEN UNAVAILABLE</Text>
        <Text style={[styles.fallbackTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.fallbackBody, { color: colors.subtext }]}>
          This screen depends on native modules that are not available in the installed app build yet.
          Rebuild or reinstall the Android app after dependency changes, then try again.
        </Text>
        {error ? (
          <Text style={[styles.fallbackError, { color: colors.subtext }]}>
            {String(error.message || error)}
          </Text>
        ) : null}
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.fallbackButton}>
          <Text style={styles.fallbackButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createSafeLazyScreen(loader, title) {
  return function SafeLazyScreen(props) {
    try {
      const Screen = loader().default;
      return <Screen {...props} />;
    } catch (error) {
      console.error(`${title} failed to load`, error);
      return <NativeModuleFallback navigation={props.navigation} title={title} error={error} />;
    }
  };
}

const NoteEditorScreenWrapper = createSafeLazyScreen(() => require('./src/screens/NoteEditorScreen'), 'Note Editor');
const OCRScreenWrapper = createSafeLazyScreen(() => require('./src/screens/OCRScreen'), 'Scanner');

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
  const mainFade = useRef(new Animated.Value(0)).current;
  const finishedRef = useRef(false);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    
    // Fallback in case video fails to load or play
    const fallbackTimer = setTimeout(() => {
      if (!finishedRef.current) {
        handleVideoFinish();
      }
    }, 5000);
    
    return () => clearTimeout(fallbackTimer);
  }, []);

  const handleVideoFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    Animated.timing(mainFade, { toValue: 1, duration: 600, useNativeDriver: true }).start(() => {
      setIsLoading(false);
    });
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.didJustFinish) {
      handleVideoFinish();
    }
    if (status.error) {
      handleVideoFinish();
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <View style={{ flex: 1 }}>
          <Animated.View style={{ flex: 1, opacity: mainFade }}>
            <AppNavigator />
          </Animated.View>

          {isLoading && (
            <View style={styles.splashContainer}>
              <Video
                source={require('./assets/Can_you_make_motion_graphics_f.mp4')}
                style={{ width: '100%', height: '100%' }}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isMuted
                onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                onError={() => handleVideoFinish()}
              />
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  tagline: {
    color: '#9A9A9A',
    fontSize: 13,
    letterSpacing: 1.5,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  fallbackScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackCard: {
    width: '100%',
    maxWidth: 460,
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
  },
  fallbackEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 10,
  },
  fallbackTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  fallbackBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  fallbackError: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
  },
  fallbackButton: {
    marginTop: 22,
    alignSelf: 'flex-start',
    backgroundColor: '#C9A84C',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  fallbackButtonText: {
    color: '#0B0C0F',
    fontWeight: '700',
    fontSize: 14,
  },
});
