declare module '@testing-library/react-native' {
  import { ReactElement } from 'react';
  import { View } from 'react-native';

  export function render(ui: ReactElement): {
    getByText: (text: string | RegExp) => View;
    queryByText: (text: string | RegExp) => View | null;
    toJSON: () => any;
    unmount: () => void;
  };

  export function renderHook<T>(render: () => T): {
    result: { current: T };
    unmount: () => void;
  };

  export function act(asyncAction: () => Promise<void> | void): Promise<void>;
}
