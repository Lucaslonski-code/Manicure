import { Audio } from 'expo-av';

type Sound = 'appointment-success' | 'action-success' | 'action-error' | 'notification' | 'cancel' | 'reschedule';

const soundFiles: Record<Sound, string> = {
  'appointment-success': 'appointment-success',
  'action-success': 'action-success',
  'action-error': 'action-error',
  'notification': 'notification',
  'cancel': 'cancel',
  'reschedule': 'reschedule',
};

export class AudioService {
  private pendingPlayers = new Set<Audio.Sound>();

  private async getSoundSrc(sound: Sound): Promise<any> {
    try {
      const name = soundFiles[sound];
      const path = '../assets/audio/' + name;
      const r: (id: string) => any = require;
      return r(path);
    } catch {
      return null;
    }
  }

  async play(sound: Sound): Promise<void> {
    try {
      const src = await this.getSoundSrc(sound);
      if (!src) return;

      const { sound: soundObj } = await Audio.Sound.createAsync(src);
      this.pendingPlayers.add(soundObj);
      await soundObj.playAsync();
      soundObj.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          this.pendingPlayers.delete(soundObj);
          soundObj.unloadAsync().catch(() => {});
        }
      });
    } catch (e) {
      console.warn(`AudioService: failed to play ${sound}`, e);
    }
  }

  async preload(sound: Sound): Promise<void> {
    try {
      const src = await this.getSoundSrc(sound);
      if (!src) return;
      const { sound: soundObj } = await Audio.Sound.createAsync(src);
      await soundObj.unloadAsync();
    } catch (e) {
      console.warn(`AudioService preload failed for ${sound}`, e);
    }
  }

  async cleanup(): Promise<void> {
    for (const player of this.pendingPlayers) {
      try {
        await player.unloadAsync();
      } catch {}
    }
    this.pendingPlayers.clear();
  }
}