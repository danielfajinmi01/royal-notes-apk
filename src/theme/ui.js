import { Platform } from 'react-native';
import { hexAlpha } from '../utils/colorUtils';

export const UI_FONTS = {
  serif: 'Poppins',
  sans: Platform.OS === 'ios' ? 'System' : 'sans-serif',
};

export const UI_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const UI_RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  round: 999,
};

export function getScreenGradient(isDark) {
  return isDark ? ['#000000', '#000000'] : ['#FFFFFF', '#FFFFFF'];
}

export function getPanelColor(colors, isDark) {
  return isDark ? '#0B0B0B' : '#FFFFFF';
}

export function getGlassBorder(colors, isDark) {
  return isDark ? '#1F1F1F' : '#E6E6E6';
}

export function getMutedLine(colors, isDark) {
  return isDark ? hexAlpha('#FFFFFF', 0.08) : '#ECECEC';
}
