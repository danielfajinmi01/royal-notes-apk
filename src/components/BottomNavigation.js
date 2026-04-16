import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { hexAlpha } from '../utils/colorUtils';
import { UI_RADIUS, UI_SPACING, getGlassBorder, getPanelColor } from '../theme/ui';

const BOTTOM_NAV_ITEMS = [
  { id: 'home-create', label: 'Home/Create', icon: 'home' },
  { id: 'notes', label: 'Note', icon: 'file-text' },
  { id: 'tasks', label: 'Task', icon: 'check-square' },
  { id: 'scan', label: 'Scan', icon: 'camera' },
];

export default function BottomNavigation({ colors, isDark, navigation, currentRoute }) {
  const insets = useSafeAreaInsets();

  const handlePress = itemId => {
    if (itemId === 'home-create') {
      if (currentRoute === 'Home') {
        navigation.navigate('NoteEditor', { note: null });
        return;
      }
      navigation.navigate('Home');
      return;
    }

    if (itemId === 'notes') {
      navigation.navigate('NotesList');
      return;
    }

    if (itemId === 'tasks') {
      navigation.navigate('Todo');
      return;
    }

    navigation.navigate('OCR');
  };

  const isActive = itemId => {
    if (itemId === 'home-create') {
      return currentRoute === 'Home';
    }
    if (itemId === 'notes') {
      return currentRoute === 'NotesList' || currentRoute === 'NoteEditor';
    }
    if (itemId === 'tasks') {
      return currentRoute === 'Todo';
    }
    return currentRoute === 'OCR';
  };

  return (
    <View
      style={[
        styles.bottomNav,
        {
          backgroundColor: getPanelColor(colors, isDark),
          borderColor: getGlassBorder(colors, isDark),
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {BOTTOM_NAV_ITEMS.map(item => {
        const active = isActive(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => handlePress(item.id)}
            style={[
              styles.bottomNavItem,
              active && { backgroundColor: hexAlpha(colors.accent, isDark ? 0.18 : 0.14) },
            ]}
          >
            <Feather
              name={item.icon}
              size={18}
              color={active ? colors.accent : hexAlpha(colors.text, 0.7)}
            />
            <Text
              style={[
                styles.bottomNavLabel,
                { color: active ? colors.accent : hexAlpha(colors.text, 0.7) },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: UI_RADIUS.lg,
    paddingTop: 10,
    paddingHorizontal: 10,
    marginTop: UI_SPACING.md,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: UI_RADIUS.md,
    paddingVertical: 10,
    gap: 4,
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
