import React from 'react';
import fs from 'fs';
import path from 'path';

jest.mock('react-native', () => ({
  View: 'View',
  Image: 'Image',
  Animated: {
    Value: class {
      value: number;
      constructor(v: number) {
        this.value = v;
      }
    },
    timing: jest.fn().mockImplementation(() => ({
      start: (cb: (s: { finished: boolean }) => void) => {
        cb && cb({ finished: true });
      },
    })),
  },
  StyleSheet: { create: (s: any) => s },
  Platform: { OS: 'android', select: (o: any) => o?.android || o?.default },
}));

jest.mock('../../assets/TelaInicial.png', () => 'TelaInicial', { virtual: true });

jest.mock('@theme', () => ({ colors: { background: '#F5F0EA' } }));

const SOURCE = fs.readFileSync(path.join(__dirname, '../../components/InitialScreen.tsx'), 'utf-8');

describe('InitialScreen', () => {
  it('should render without crashing', () => {
    const InitialScreen = require('@components/InitialScreen').default;
    const element = React.createElement(InitialScreen, { onFinish: () => {} });
    expect(element).toBeTruthy();
    expect(element.type).toBe(InitialScreen);
  });

  it('should load TelaInicial', () => {
    expect(SOURCE).toContain('TelaInicial.png');
  });

  it('should not depend on session/auth (no useAuth, supabase or getSession)', () => {
    expect(SOURCE).not.toContain('@hooks/useAuth');
    expect(SOURCE).not.toContain('getSession');
    expect(SOURCE).not.toContain('supabase');
    expect(SOURCE).not.toContain('fetch');
  });

  it('should implement a short smooth fade with Animated', () => {
    expect(SOURCE).toContain('Animated.timing');
    expect(SOURCE).toContain('opacity');
    expect(SOURCE).toContain('useNativeDriver');
  });

  it('should expose an accessibility label and add no extra text', () => {
    expect(SOURCE).toContain('accessibilityLabel');
    expect(SOURCE).not.toContain('Carregando');
    expect(SOURCE).not.toContain('Bem-vindo');
    expect(SOURCE).not.toContain('Entrando');
  });

  it('should not distort the image (resizeMode defined)', () => {
    expect(SOURCE).toContain('resizeMode');
  });

  it('should clean up the animation on unmount', () => {
    expect(SOURCE).toContain('clearTimeout');
    expect(SOURCE).toContain('useNativeDriver');
  });
});
