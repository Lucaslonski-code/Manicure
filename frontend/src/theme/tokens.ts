export const colors = {
  background: '#F5F0EA',
  surface: '#FFFFFF',
  beige: '#E3D5C6',
  brown: '#6F6256',
  black: '#25221F',
  gold: '#B99B68',
  goldLight: '#D4C4A8',
  textPrimary: '#25221F',
  textSecondary: '#6F6256',
  border: '#E3D5C6',
  primary: '#25221F',
  primaryPressed: '#3D3833',
  success: '#4A7C59',
  warning: '#B99B68',
  error: '#A63D40',
  disabled: '#B8B0A8',
  disabledBackground: '#F5F0EA',
  focus: '#B99B68',
  overlay: 'rgba(37,34,31,0.4)',
  goldOverlay: 'rgba(185,155,104,0.08)',
};

export const typography = {
  display: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38, letterSpacing: -0.5 },
  headingLarge: { fontSize: 26, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.3 },
  headingMedium: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26, letterSpacing: -0.2 },
  headingSmall: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22, letterSpacing: -0.1 },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24, letterSpacing: 0 },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20, letterSpacing: 0 },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16, letterSpacing: 0 },
  label: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16, letterSpacing: 0.3, textTransform: 'uppercase' as const },
  input: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22, letterSpacing: 0 },
  button: { fontSize: 15, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0.3 },
  caption: { fontSize: 11, fontWeight: '400' as const, lineHeight: 14, letterSpacing: 0.2 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const elevation = {
  none: { shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  sm: { shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  md: { shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  lg: { shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
};

export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
};

export const touchTarget = {
  min: 44,
  comfortable: 48,
};
