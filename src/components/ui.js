import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { hexAlpha } from '../utils/colorUtils';
import {
  UI_FONTS,
  UI_RADIUS,
  UI_SPACING,
  getGlassBorder,
  getMutedLine,
  getPanelColor,
} from '../theme/ui';

export function ThemedSurface({ children, colors, isDark, style }) {
  return (
    <View
      style={[
        styles.surface,
        {
          backgroundColor: getPanelColor(colors, isDark),
          borderColor: getGlassBorder(colors, isDark),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function IconCircleButton({
  icon,
  onPress,
  colors,
  size = 40,
  backgroundColor,
  color,
  style,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.iconButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor || 'transparent',
        },
        style,
      ]}
    >
      <Feather name={icon} size={Math.max(16, Math.round(size * 0.45))} color={color || colors.text} />
    </TouchableOpacity>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  colors,
  isDark,
  onBack,
  rightAction,
  style,
}) {
  return (
    <ThemedSurface colors={colors} isDark={isDark} style={[styles.headerPanel, style]}>
      {onBack ? (
        <IconCircleButton icon="chevron-left" onPress={onBack} colors={colors} />
      ) : (
        <View style={styles.headerSpacer} />
      )}
      <View style={styles.headerCopy}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.headerSub, { color: colors.subtext }]}>{subtitle}</Text>}
      </View>
      {rightAction || <View style={styles.headerSpacer} />}
    </ThemedSurface>
  );
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
  colors,
  isDark,
  onClear,
  style,
  inputStyle,
  onSubmitEditing,
}) {
  return (
    <ThemedSurface colors={colors} isDark={isDark} style={[styles.searchPanel, style]}>
      <Feather name="search" size={18} color={colors.subtext} />
      <TextInput
        style={[styles.searchInput, { color: colors.text }, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={colors.subtext}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
      />
      {!!value && (
        <TouchableOpacity onPress={onClear || (() => onChangeText(''))}>
          <Feather name="x" size={18} color={colors.subtext} />
        </TouchableOpacity>
      )}
    </ThemedSurface>
  );
}

export function EmptyState({ icon, title, subtitle, colors, tint = '#C9A84C', style }) {
  return (
    <View style={[styles.emptyState, style]}>
      <View style={[styles.emptyIconWrap, { backgroundColor: hexAlpha(tint, 0.14) }]}>
        <Feather name={icon} size={28} color={tint} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptySub, { color: colors.subtext }]}>{subtitle}</Text>
    </View>
  );
}

export function HeaderDivider({ colors, isDark, style }) {
  return <View style={[styles.divider, { backgroundColor: getMutedLine(colors, isDark) }, style]} />;
}

const styles = StyleSheet.create({
  surface: {
    borderWidth: 1,
    borderRadius: UI_RADIUS.lg,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI_SPACING.md,
    paddingVertical: UI_SPACING.md,
    marginTop: UI_SPACING.lg,
    marginBottom: UI_SPACING.md,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  headerCopy: {
    flex: 1,
    marginLeft: UI_SPACING.sm,
    marginRight: UI_SPACING.sm,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: UI_FONTS.serif,
  },
  headerSub: {
    fontSize: 12,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  searchPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: UI_RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 70,
    paddingHorizontal: UI_SPACING.xl,
  },
  emptyIconWrap: {
    width: 78,
    height: 78,
    borderRadius: 26,
    marginBottom: UI_SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: UI_FONTS.serif,
    marginBottom: UI_SPACING.sm,
  },
  emptySub: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 34,
  },
});
