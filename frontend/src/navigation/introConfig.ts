export const MIN_INTRO_MS = 1000;

export function isIntroComplete(timerDone: boolean, authReady: boolean): boolean {
  return timerDone && authReady;
}
