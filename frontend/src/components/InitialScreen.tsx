import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';
import { colors } from '@theme';

const BRAND_ICON = require('../../assets/IconAppWhite.png');

const FADE_DURATION_MS = 400;
const DISPLAY_DURATION_MS = 1200;
const TOTAL_DURATION_MS = FADE_DURATION_MS + DISPLAY_DURATION_MS + FADE_DURATION_MS;

export type InitialScreenProps = {
  dismiss?: boolean;
  onFinish?: () => void;
};

export default function InitialScreen({ dismiss = false, onFinish }: InitialScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const finishedRef = useRef(false);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_DURATION_MS,
      useNativeDriver: true,
    }).start();

    if (!dismiss) {
      return;
    }
    if (finishedRef.current) {
      return;
    }

    const dismissTimer = setTimeout(() => {
      if (finishedRef.current) return;
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
    }, FADE_DURATION_MS + DISPLAY_DURATION_MS);

    animationTimeoutRef.current = setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish?.();
      }
    }, TOTAL_DURATION_MS + 200);

    return () => {
      clearTimeout(dismissTimer);
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [dismiss, opacity, onFinish]);

  return (
    <View
      style={styles.container}
      accessibilityLabel="Tela inicial do AppManicure"
      accessibilityRole="image"
    >
      <Animated.View style={[styles.iconWrap, { opacity }]}>
        <Image source={BRAND_ICON} style={styles.icon} resizeMode="contain" />
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
  iconWrap: {
    width: 144,
    height: 96,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
});
