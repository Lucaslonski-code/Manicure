import React from 'react';
import { Image, StyleSheet } from 'react-native';

const LOGO = require('../../../assets/IconAppWhite.png');

const ASPECT_RATIO = 1536 / 1024;

interface BrandLogoProps {
  size?: number;
  style?: object;
}

export default function BrandLogo({ size = 104, style }: BrandLogoProps) {
  return (
    <Image
      source={LOGO}
      style={[styles.logo, { width: size, height: size / ASPECT_RATIO }, style]}
      resizeMode="contain"
      accessibilityLabel="AppManicure"
      accessibilityRole="image"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
  },
});
