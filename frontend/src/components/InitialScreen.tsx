import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';
import { colors } from '@theme';

const INTRO_IMAGE = require('../../assets/TelaInicial.png');

const FADE_DURATION_MS = 300;

export type InitialScreenProps = {
  dismiss?: boolean;
  onFinish?: () => void;
};

export default function InitialScreen({ dismiss = false, onFinish }: InitialScreenProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!dismiss) {
      return;
    }
    if (finishedRef.current) {
      return;
    }
    const animation = Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_DURATION_MS,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !finishedRef.current) {
        finishedRef.current = true;
        onFinish?.();
      }
    });
    return () => {
      animation.stop();
    };
  }, [dismiss, opacity, onFinish]);

  return (
    <View
      style={styles.container}
      accessibilityLabel="Tela inicial do AppManicure"
      accessibilityRole="image"
    >
      <Animated.View style={[styles.imageWrap, { opacity }]}>
        <Image source={INTRO_IMAGE} style={styles.image} resizeMode="contain" />
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
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
