import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigator from '@navigation/RootNavigator';

// O splash nativo é controlado no App Root (não no RootNavigator) para
// desacoplar o lifecycle nativo da resolução de estado de autenticação.
// preventAutoHideAsync() deve ser chamado uma única vez, no module scope,
// antes do primeiro render do React Native.
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    // hideAsync() é chamado no primeiro frame do App Root. A UI segura
    // (RootNavigator) já está montada, então o splash pode ser removido.
    // Se o bootstrap de auth demorar, o RootNavigator exibe um
    // LoadingFallback próprio — o splash nativo já foi liberado.
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
