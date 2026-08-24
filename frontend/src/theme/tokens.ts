export const colors = {
  background: '#F5F0EA',
  surface: '#FFFFFF',
  beige: '#E3D5C6',
  brown: '#6F6256',
  black: '#25221F',
  gold: '#B99B68',
  textPrimary: '#25221F',
  textSecondary: '#6F6256',
  border: '#E3D5C6',
  primary: '#25221F',
  primaryPressed: '#3D3833',
  success: '#4A7C59',
  warning: '#B99B68',
  error: '#A63D40',
  disabled: '#B8B0A8',
};

export const typography = {
  display: { fontSize: 34, fontWeight: '700' as const, lineHeight: 40 },
  headingLarge: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  headingMedium: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
  headingSmall: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  input: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 11, fontWeight: '400' as const, lineHeight: 14 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const elevation = {
  none: { shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  sm: { shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  md: { shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  lg: { shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
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
