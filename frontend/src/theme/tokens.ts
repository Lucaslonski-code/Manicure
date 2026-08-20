export const colors = {
  primary: '#000000',
  secondary: '#666666',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  border: '#E0E0E0',
  text: '#111111',
  textSecondary: '#666666',
  error: '#D32F2F',
  success: '#388E3C',
};

export const typography = {
  headingLarge: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  headingMedium: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
  headingSmall: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

export const elevation = {
  sm: { shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: { shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  lg: { shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
};
