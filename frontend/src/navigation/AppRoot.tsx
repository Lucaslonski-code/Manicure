import React, { useState, useCallback } from 'react';
import { useAuth } from '@hooks/useAuth';
import RootNavigator from './RootNavigator';
import InitialScreen from '@components/InitialScreen';

export default function AppRoot() {
  const authState = useAuth();
  const [introDone, setIntroDone] = useState(false);

  const onFinish = useCallback(() => setIntroDone(true), []);

  if (introDone) {
    return <RootNavigator authState={authState} />;
  }

  return <InitialScreen onFinish={onFinish} />;
}
