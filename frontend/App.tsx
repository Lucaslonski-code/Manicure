import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '@theme/ThemeProvider';
import AppRoot from '@navigation/AppRoot';

SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    // Garante que o splash nativo seja ocultado mesmo se houver erro no render
    let mounted = true;
    SplashScreen.hideAsync().catch((err) => {
      console.error('Failed to hide splash screen:', err);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppRoot />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
