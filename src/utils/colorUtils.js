/**
 * Color utilities for Royal Notes.
 * Luminance-based contrast logic ensures text is always readable
 * against any background (solid color or image).
 */

/**
 * Parse a hex color string to { r, g, b } in 0–255 range.
 */
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Relative luminance as per WCAG 2.1.
 * Returns a value in [0, 1] where 0 = black, 1 = white.
 */
export function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Returns '#FFFFFF' or '#000000' – whichever has better contrast
 * against the given background hex color.
 */
export function getContrastText(bgHex) {
  const lum = getLuminance(bgHex);
  return lum > 0.35 ? '#000000' : '#FFFFFF';
}

/**
 * For wallpaper backgrounds we can't compute luminance from a hex,
 * so we use a semi-transparent overlay strategy.
 * Returns an overlay style object: dark overlay for readability.
 */
export function getWallpaperOverlayStyle(isDark) {
  return {
    backgroundColor: isDark
      ? 'rgba(0,0,0,0.45)'
      : 'rgba(255,255,255,0.30)',
  };
}

/**
 * Darken a hex color by a given amount (0–1).
 */
export function darken(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 - amount;
  const toHex = (c) => Math.round(c * factor).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Lighten a hex color by a given amount (0–1).
 */
export function lighten(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const toHex = (c) => Math.min(255, Math.round(c + (255 - c) * amount)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Add alpha to a hex color. Returns rgba() string.
 */
export function hexAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
