export const MIN_INTRO_MS = 1000;
export const MAX_INTRO_MS = 10000;

export function isIntroComplete(timerDone: boolean, authReady: boolean, maxTimeExceeded: boolean): boolean {
  return maxTimeExceeded || (timerDone && authReady);
}
