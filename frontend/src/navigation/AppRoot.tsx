import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@hooks/useAuth';
import RootNavigator from './RootNavigator';
import InitialScreen from '@components/InitialScreen';
import { MIN_INTRO_MS, isIntroComplete } from './introConfig';

export default function AppRoot() {
  const authState = useAuth();

  const [timerDone, setTimerDone] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimerDone(true), MIN_INTRO_MS);
    return () => clearTimeout(timer);
  }, []);

  const onFinish = useCallback(() => setIntroDone(true), []);

  if (introDone) {
    return <RootNavigator authState={authState} />;
  }

  const authReady = !authState.loading;
  const dismiss = isIntroComplete(timerDone, authReady);

  return <InitialScreen dismiss={dismiss} onFinish={onFinish} />;
}
