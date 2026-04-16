import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PALETTE = {
  colors: [
    { id: 'navy', label: 'Navy', value: '#0D1B2A' },
    { id: 'teal', label: 'Teal', value: '#0D3B38' },
    { id: 'deepPurple', label: 'Deep Purple', value: '#1A0533' },
    { id: 'slate', label: 'Slate', value: '#1C2840' },
    { id: 'midnight', label: 'Midnight', value: '#0A0A1A' },
    { id: 'forest', label: 'Forest', value: '#0B2617' },
    { id: 'ivory', label: 'Ivory', value: '#FAF7F0' },
    { id: 'frost', label: 'Frost', value: '#EEF2F7' },
  ],
  gold: '#C9A84C',
  goldLight: '#F0D080',
  dark: {
    bg: '#000000',
    surface: '#000000',
    card: '#111111',
    border: '#242424',
    text: '#FFFFFF',
    subtext: '#9B9B9B',
    accent: '#C9A84C',
  },
  light: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    card: '#F8F8F8',
    border: '#E6E6E6',
    text: '#000000',
    subtext: '#6E6E6E',
    accent: '#9E7A2B',
  },
};

const ThemeContext = createContext(null);
const STORAGE_KEY = '@royal_notes_theme';

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(true);
  const [systemAware, setSystemAware] = useState(true);
  const [accent, setAccent] = useState(PALETTE.gold);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!saved) {
          return;
        }

        const prefs = JSON.parse(saved);
        setSystemAware(prefs.systemAware ?? true);
        if (!prefs.systemAware) {
          setIsDark(prefs.isDark ?? true);
        }
        if (prefs.accent) {
          setAccent(prefs.accent);
        }
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    if (systemAware) {
      setIsDark(systemScheme === 'dark');
    }
  }, [systemAware, systemScheme]);

  const savePrefs = async prefs => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (_) {}
  };

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    setSystemAware(false);
    savePrefs({ isDark: next, systemAware: false, accent });
  };

  const enableSystemAware = () => {
    const next = systemScheme === 'dark';
    setSystemAware(true);
    setIsDark(next);
    savePrefs({ isDark: next, systemAware: true, accent });
  };

  const colors = isDark ? PALETTE.dark : PALETTE.light;

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggleDark,
        systemAware,
        enableSystemAware,
        colors,
        accent,
        setAccent,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
