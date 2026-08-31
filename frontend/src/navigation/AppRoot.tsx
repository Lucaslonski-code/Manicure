import React, { useState, useCallback } from 'react';
import { AuthProvider } from '@hooks/AuthContext';
import RootNavigator from './RootNavigator';
import InitialScreen from '@components/InitialScreen';

export default function AppRoot() {
  return (
    <AuthProvider>
      <AppRootContent />
    </AuthProvider>
  );
}

function AppRootContent() {
  const [introDone, setIntroDone] = useState(false);

  const onFinish = useCallback(() => setIntroDone(true), []);

  if (introDone) {
    return <RootNavigator />;
  }

  return <InitialScreen onFinish={onFinish} />;
}
