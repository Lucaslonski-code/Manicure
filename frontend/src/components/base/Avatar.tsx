import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '@theme';

interface AvatarProps {
  source?: { uri: string };
  name?: string;
  size?: number;
  borderColor?: string;
}

export default function Avatar({ source, name, size = 40, borderColor }: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  const avatarStyle = [
    styles.base,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: borderColor ? 2 : 0,
      borderColor: borderColor || 'transparent',
    },
  ];

  if (source?.uri) {
    return (
      <Image
        source={{ uri: source.uri }}
        style={avatarStyle}
        accessibilityLabel={`Avatar de ${name || 'usuário'}`}
      />
    );
  }

  return (
    <View style={avatarStyle} accessibilityLabel={`Avatar de ${name || 'usuário'}`}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
        {initials || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: colors.textPrimary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
