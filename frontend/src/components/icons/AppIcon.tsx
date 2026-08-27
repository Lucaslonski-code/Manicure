import React from 'react';
import { View, StyleSheet, ViewStyle, AccessibilityRole } from 'react-native';
import { colors } from '@theme';

const STROKE_WIDTH = 1.5;

const iconColors = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  gold: colors.gold,
  success: colors.success,
  error: colors.error,
  warning: colors.warning,
  disabled: colors.disabled,
  surface: colors.surface,
};

export type IconName =
  | 'home'
  | 'calendar'
  | 'bell'
  | 'user'
  | 'chevron-right'
  | 'chevron-left'
  | 'back'
  | 'close'
  | 'check'
  | 'search'
  | 'eye'
  | 'eye-off'
  | 'lock'
  | 'warning'
  | 'error'
  | 'sparkles'
  | 'person'
  | 'mail'
  | 'phone'
  | 'time'
  | 'document-text'
  | 'people'
  | 'scissors'
  | 'heart'
  | 'settings'
  | 'logout'
  | 'edit'
  | 'delete'
  | 'add'
  | 'remove'
  | 'refresh'
  | 'filter'
  | 'menu';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconColor = keyof typeof iconColors;

const SIZE_MAP: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const icons: Record<IconName, React.FC<{ color: string; size: number }>> = {
  home: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 12L12 3L21 12" />
      <Path d="M5 10V20H10V14H14V20H19V10" />
    </Svg>
  ),
  calendar: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="5" width="18" height="16" rx="3" />
      <Path d="M3 10H21" />
      <Path d="M8 3V7" />
      <Path d="M16 3V7" />
    </Svg>
  ),
  bell: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8C18 5.5 16 3.5 13.5 3.5C11 3.5 9 5.5 9 8C9 13 6 15 6 15H15C15 15 12 13 12 8" />
      <Path d="M13.5 18C14.3 18 15 18.7 15 19.5C15 20.3 14.3 21 13.5 21C12.7 21 12 20.3 12 19.5C12 18.7 12.7 18 13.5 18Z" />
    </Svg>
  ),
  user: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="8" r="4" />
      <Path d="M5 20C5 16.5 8 14 12 14C16 14 19 16.5 19 20" />
    </Svg>
  ),
  'chevron-right': ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 6L15 12L9 18" />
    </Svg>
  ),
  'chevron-left': ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6L9 12L15 18" />
    </Svg>
  ),
  back: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 18L9 12L15 6" />
    </Svg>
  ),
  close: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18" />
      <Path d="M6 6L18 18" />
    </Svg>
  ),
  check: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12L10 17L19 7" />
    </Svg>
  ),
  search: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="11" cy="11" r="7" />
      <Path d="M21 21L16.5 16.5" />
    </Svg>
  ),
  eye: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  ),
  'eye-off': ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9.5 9.5C9.5 9.5 10.5 10.5 12 10.5C13.5 10.5 14.5 9.5 14.5 9.5" />
      <Path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" />
      <Path d="M2 2L22 22" />
    </Svg>
  ),
  lock: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="4" y="10" width="16" height="11" rx="3" />
      <Path d="M8 10V7C8 4.5 10 3 12 3C14 3 16 4.5 16 7V10" />
    </Svg>
  ),
  warning: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 9V13" />
      <Circle cx="12" cy="17" r="0.5" fill={color} />
      <Path d="M12 3L21 20H3L12 3Z" />
    </Svg>
  ),
  error: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="9" />
      <Path d="M15 9L9 15" />
      <Path d="M9 9L15 15" />
    </Svg>
  ),
  sparkles: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
      <Path d="M5 16L5.5 18L7 18.5L5.5 19L5 21L4.5 19L3 18.5L4.5 18L5 16Z" />
      <Path d="M19 5L19.5 7L21 7.5L19.5 8L19 10L18.5 8L17 7.5L18.5 7L19 5Z" />
    </Svg>
  ),
  person: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="8" r="4" />
      <Path d="M5 20C5 16.5 8 14 12 14C16 14 19 16.5 19 20" />
    </Svg>
  ),
  mail: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="5" width="18" height="14" rx="3" />
      <Path d="M3 7L12 13L21 7" />
    </Svg>
  ),
  phone: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 4H8L10 9L8.5 10.5C10.5 14.5 14.5 18.5 18.5 20.5L20 19L21 22L18 22C16 22 14 21 13 20L11 18H8C6 18 4 16 4 14C4 10 7 6 11 4C11.5 3.5 12 3 12 3" />
    </Svg>
  ),
  time: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7V12L15 15" />
    </Svg>
  ),
  'document-text': ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 2H7C5.5 2 5 2.5 5 4V20C5 21.5 5.5 22 7 22H17C18.5 22 19 21.5 19 20V8L14 2Z" />
      <Path d="M14 2L19 7" />
      <Path d="M9 13H15" />
      <Path d="M9 17H13" />
    </Svg>
  ),
  people: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="7" cy="8" r="3" />
      <Path d="M2 20C2 17 4 15 7 15C10 15 12 17 12 20" />
      <Circle cx="17" cy="8" r="2.5" />
      <Path d="M14 20C14 17.5 15.5 16 17.5 16C19.5 16 21 17.5 21 20" />
    </Svg>
  ),
  scissors: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="6" cy="6" r="3" />
      <Circle cx="6" cy="18" r="3" />
      <Path d="M20 4L8.5 12.5" />
      <Path d="M20 4L13.5 18.5" />
      <Path d="M8.5 12.5L13.5 18.5" />
    </Svg>
  ),
  heart: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 21C12 21 4 14.5 4 9C4 6 6.5 4 9 4C10.5 4 12 5 12 5C12 5 13.5 4 15 4C17.5 4 20 6 20 9C20 14.5 12 21 12 21Z" />
    </Svg>
  ),
  settings: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15C19.4 15 19.9 17.5 18.5 19C17.5 20.5 15.5 21 15.5 21" />
      <Path d="M4.5 9C4.5 9 2.5 7.5 2 5C1.5 2.5 3 1 3 1" />
      <Path d="M21 9C21 9 22.5 7.5 22 5C21.5 2.5 20 1 20 1" />
      <Path d="M4.5 15C4.5 15 2.5 16.5 2 19C1.5 21.5 3 23 3 23" />
      <Path d="M12 2V4" />
      <Path d="M12 20V22" />
      <Path d="M2 12H4" />
      <Path d="M20 12H22" />
    </Svg>
  ),
  logout: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 21H6C4.5 21 4 20.5 4 19V5C4 3.5 4.5 3 6 3H9" />
      <Path d="M16 17L21 12L16 7" />
      <Path d="M21 12H10" />
    </Svg>
  ),
  edit: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 4L4 11L11 18" />
      <Path d="M4 11H20" />
      <Path d="M18 7L21 4L17 1" />
    </Svg>
  ),
  delete: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 7H20" />
      <Path d="M10 11V17" />
      <Path d="M14 11V17" />
      <Path d="M5 7L7 21H17L19 7" />
      <Path d="M9 7V4H15V7" />
    </Svg>
  ),
  add: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 5V19" />
      <Path d="M5 12H19" />
    </Svg>
  ),
  remove: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12H19" />
    </Svg>
  ),
  refresh: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 12C21 16.5 17.5 20 13 20C9.5 20 6 18.5 4.5 15.5" />
      <Path d="M3 12C3 7.5 6.5 4 11 4C14.5 4 18 5.5 19.5 8.5" />
      <Path d="M21 3V8H16" />
      <Path d="M3 21V16H8" />
    </Svg>
  ),
  filter: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 6H20" />
      <Path d="M6 12H18" />
      <Path d="M8 18H16" />
    </Svg>
  ),
  menu: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 7H20" />
      <Path d="M4 12H20" />
      <Path d="M4 17H20" />
    </Svg>
  ),
};

interface AppIconProps {
  name: IconName;
  size?: IconSize | number;
  color?: IconColor;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: any;
  testID?: string;
}

export default function AppIcon({
  name,
  size = 'md',
  color = 'primary',
  style,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  testID,
}: AppIconProps) {
  const resolvedSize = typeof size === 'number' ? size : SIZE_MAP[size];
  const resolvedColor = iconColors[color];
  const IconComponent = icons[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in AppIcon system`);
    return null;
  }

  return (
    <View
      style={[styles.container, style]}
      accessibilityLabel={accessibilityLabel || name}
      accessibilityRole={accessibilityRole || 'image'}
      accessibilityState={accessibilityState}
      testID={testID}
    >
      <IconComponent color={resolvedColor} size={resolvedSize} />
    </View>
  );
}

const Svg = ({ width, height, viewBox, fill, stroke, strokeWidth, strokeLinecap, strokeLinejoin, children }: any) => (
  <svg
    width={width}
    height={height}
    viewBox={viewBox}
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap={strokeLinecap}
    strokeLinejoin={strokeLinejoin}
    style={{ display: 'block' }}
  >
    {children}
  </svg>
);

const Path = ({ d, fill, stroke }: any) => (
  <path d={d} fill={fill || 'none'} stroke={stroke || 'none'} />
);

const Circle = ({ cx, cy, r, fill, stroke }: any) => (
  <circle cx={cx} cy={cy} r={r} fill={fill || 'none'} stroke={stroke || 'none'} />
);

const Rect = ({ x, y, width, height, rx, ry, fill, stroke }: any) => (
  <rect
    x={x}
    y={y}
    width={width}
    height={height}
    rx={rx || 0}
    ry={ry || rx || 0}
    fill={fill || 'none'}
    stroke={stroke || 'none'}
  />
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { SIZE_MAP, iconColors };