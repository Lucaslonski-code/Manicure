import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@hooks/useAuth';
import RootNavigator from './RootNavigator';
import InitialScreen from '@components/InitialScreen';
import { MIN_INTRO_MS, MAX_INTRO_MS, isIntroComplete } from './introConfig';

export default function AppRoot() {
  const authState = useAuth();

  const [timerDone, setTimerDone] = useState(false);
  const [maxTimeExceeded, setMaxTimeExceeded] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const minTimer = setTimeout(() => setTimerDone(true), MIN_INTRO_MS);
    const maxTimer = setTimeout(() => setMaxTimeExceeded(true), MAX_INTRO_MS);
    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, []);

  const onFinish = useCallback(() => setIntroDone(true), []);

  if (introDone) {
    return <RootNavigator authState={authState} />;
  }

  const authReady = !authState.loading;
  const dismiss = isIntroComplete(timerDone, authReady, maxTimeExceeded);

  return <InitialScreen dismiss={dismiss} onFinish={onFinish} />;
}
