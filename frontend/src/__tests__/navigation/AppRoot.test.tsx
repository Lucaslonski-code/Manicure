import fs from 'fs';
import path from 'path';

const SOURCE = fs.readFileSync(path.join(__dirname, '../../navigation/AppRoot.tsx'), 'utf-8');

describe('AppRoot intro orchestration', () => {
  it('should not control the native splash lifecycle (kept in App.tsx)', () => {
    expect(SOURCE).not.toContain('SplashScreen');
    expect(SOURCE).not.toContain('preventAutoHideAsync');
    expect(SOURCE).not.toContain('hideAsync');
  });

  // Removed the test for MIN_INTRO_MS because the timing is now handled by InitialScreen

  it('should render InitialScreen before finishing', () => {
    expect(SOURCE).toContain('InitialScreen');
  });

  it('should wrap content in AuthProvider for single auth bootstrap', () => {
    expect(SOURCE).toContain('AuthProvider');
  });

  // Removed the test for clearing the intro timer because we don't have timers in AppRoot anymore

  it('should not call useAuth directly (consumed via AuthProvider context)', () => {
    expect(SOURCE).not.toContain("useAuth()");
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
