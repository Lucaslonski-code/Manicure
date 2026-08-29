export const colors = {
  background: '#F5F0EA',
  surface: '#FFFFFF',
  surfaceMuted: '#F8F3EC',
  beige: '#E3D5C6',
  brown: '#6F6256',
  black: '#25221F',
  gold: '#B99B68',
  goldLight: '#D4C4A8',
  textPrimary: '#25221F',
  textSecondary: '#6F6256',
  border: '#E3D5C6',
  primary: '#B99B68',
  primaryPressed: '#9A8050',
  success: '#4A7C59',
  warning: '#B99B68',
  error: '#A63D40',
  disabled: '#B8B0A8',
  disabledBackground: '#F0EBE5',
  focus: '#B99B68',
  overlay: 'rgba(37,34,31,0.4)',
  goldOverlay: 'rgba(185,155,104,0.08)',
};

export const typography = {
  display: { fontSize: 26, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: '600' as const, lineHeight: 30, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22, letterSpacing: 0 },
  section: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24, letterSpacing: -0.1 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22, letterSpacing: 0 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, letterSpacing: 0 },
  label: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16, letterSpacing: 0.3, textTransform: 'uppercase' as const },
  input: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22, letterSpacing: 0 },
  button: { fontSize: 15, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0.3 },
  caption: { fontSize: 11, fontWeight: '400' as const, lineHeight: 14, letterSpacing: 0.2 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  xxxxl: 32,
  xxxxxl: 40,
  xxxxxxl: 48,
  xxxxxxxl: 64,
  screenPadding: 24,
  smallScreenPadding: 16,
};

export const radius = {
  sm: 6,
  md: 10,
  input: 12,
  button: 14,
  card: 16,
  modal: 20,
  full: 9999,
};

export const elevation = {
  none: { shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  sm: { shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  md: { shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  lg: { shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
};

export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 96,
  xxxl: 104,
  xxxxl: 144,
};

export const touchTarget = {
  min: 44,
  comfortable: 48,
};

export const componentSizes = {
  buttonHeight: 50,
  inputHeight: 50,
};
