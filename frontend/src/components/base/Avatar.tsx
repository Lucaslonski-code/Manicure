import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '@theme';

interface AvatarProps {
  source?: { uri: string };
  name?: string;
  size?: number;
}

export default function Avatar({ source, name, size = 40 }: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  if (source?.uri) {
    return (
      <Image
        source={{ uri: source.uri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        accessibilityLabel={`Avatar de ${name || 'usuário'}`}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      accessibilityLabel={`Avatar de ${name || 'usuário'}`}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
        {initials || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.beige,
  },
  fallback: {
    backgroundColor: colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
