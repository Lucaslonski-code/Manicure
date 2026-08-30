import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';
import { colors } from '@theme';

const TELA_INICIAL = require('../../assets/TelaInicial.png');

const FADE_DURATION_MS = 400;
const HOLD_DURATION_MS = 1200; // time to hold after fade in before starting fade out

export type InitialScreenProps = {
  onFinish?: () => void;
};

export default function InitialScreen({ onFinish }: InitialScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const finishedRef = useRef(false);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_DURATION_MS,
      useNativeDriver: true,
    }).start(() => {
      // After fade in, hold for HOLD_DURATION_MS
      holdTimeoutRef.current = setTimeout(() => {
        // Fade out
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_DURATION_MS,
          useNativeDriver: true,
        }).start(() => {
          if (!finishedRef.current) {
            finishedRef.current = true;
            onFinish?.();
          }
        });
      }, HOLD_DURATION_MS);
    });

    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = null;
      }
    };
  }, [onFinish]);

  return (
    <View
      style={styles.container}
      accessibilityLabel="Tela inicial do AppManicure"
      accessibilityRole="image"
    >
      <Animated.View style={[styles.imageWrap, { opacity }]}>
        <Image source={TELA_INICIAL} style={styles.image} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    width: '80%',
    maxWidth: 320,
    height: '80%',
    maxHeight: 400,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
