import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';
import { colors } from '@theme';

const BRAND_ICON = require('../../assets/brand-icon.jpeg');

const FADE_DURATION_MS = 300;
const ANIMATION_TIMEOUT_MS = 1500;

export type InitialScreenProps = {
  dismiss?: boolean;
  onFinish?: () => void;
};

export default function InitialScreen({ dismiss = false, onFinish }: InitialScreenProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const finishedRef = useRef(false);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dismiss) {
      return;
    }
    if (finishedRef.current) {
      return;
    }

    const startAnimation = (useNative: boolean) => {
      const animation = Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: useNative,
      });

      const animationFinished = (result: { finished: boolean }) => {
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
          animationTimeoutRef.current = null;
        }
        if ((result.finished || !finishedRef.current) && !finishedRef.current) {
          finishedRef.current = true;
          onFinish?.();
        }
      };

      animation.start(animationFinished);

      animationTimeoutRef.current = setTimeout(() => {
        animation.stop();
        animationFinished({ finished: false });
      }, ANIMATION_TIMEOUT_MS);
    };

    try {
      startAnimation(true);
    } catch {
      startAnimation(false);
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
      try {
        Animated.timing(opacity, { toValue: 0, duration: 0, useNativeDriver: false }).stop();
      } catch {
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
    height: 144,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
});
