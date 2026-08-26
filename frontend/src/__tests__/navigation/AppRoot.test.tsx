import fs from 'fs';
import path from 'path';

const SOURCE = fs.readFileSync(path.join(__dirname, '../../navigation/AppRoot.tsx'), 'utf-8');

describe('AppRoot intro orchestration', () => {
  it('should not control the native splash lifecycle (kept in App.tsx)', () => {
    expect(SOURCE).not.toContain('SplashScreen');
    expect(SOURCE).not.toContain('preventAutoHideAsync');
    expect(SOURCE).not.toContain('hideAsync');
  });

  it('should define a ~1s minimum intro duration', () => {
    expect(SOURCE).toContain('MIN_INTRO_MS');
    expect(require('@navigation/introConfig').MIN_INTRO_MS).toBe(1000);
  });

  it('should render InitialScreen before finishing', () => {
    expect(SOURCE).toContain('InitialScreen');
  });

  it('should pass the resolved auth state to RootNavigator (single bootstrap, no double getSession)', () => {
    expect(SOURCE).toContain('authState={authState}');
  });

  it('should clear the intro timer on unmount', () => {
    expect(SOURCE).toContain('clearTimeout');
  });

  it('should use useAuth once at the App Root level', () => {
    expect(SOURCE).toContain("useAuth()");
  });
});

describe('isIntroComplete (intro dismissal rule)', () => {
  const { isIntroComplete } = require('@navigation/introConfig');

  it('remains false before the timer elapses', () => {
    expect(isIntroComplete(false, true, false)).toBe(false);
    expect(isIntroComplete(true, false, false)).toBe(false);
    expect(isIntroComplete(false, false, false)).toBe(false);
  });

  it('becomes true when the timer elapsed AND auth resolved', () => {
    expect(isIntroComplete(true, true, false)).toBe(true);
  });

  it('becomes true when max time exceeded regardless of other flags', () => {
    expect(isIntroComplete(false, false, true)).toBe(true);
    expect(isIntroComplete(false, true, true)).toBe(true);
    expect(isIntroComplete(true, false, true)).toBe(true);
  });
});
