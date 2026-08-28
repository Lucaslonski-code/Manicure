import { Audio } from 'expo-av';

type Sound = 'appointment-success' | 'action-success' | 'action-error' | 'notification' | 'cancel' | 'reschedule';

const soundMap: Record<Sound, string> = {
  appointment-success: require('../assets/audio/appointment-success.mp3'),
  action-success: require('../assets/audio/action-success.mp3'),
  action-error: require('../assets/audio/action-error.mp3'),
  notification: require('../assets/audio/notification.mp3'),
  cancel: require('../assets/audio/cancel.mp3'),
  reschedule: require('../assets/audio/reschedule.mp3'),
};

export class AudioService {
  private pendingPlayers = new Set<AVAudio.Sound>();

  async play<S extends Sound>(sound: S): Promise<void> {
    try {
      const src = soundMap[sound];
      if (!src) return;

      const soundObj = await Audio.Sound.createAsync(src);
      this.pendingPlayers.add(soundObj);
      await soundObj.playAsync();
      soundObj.setOnEnd(() => {
        this.pendingPlayers.delete(soundObj);
        soundObj.unloadAsync();
      });
    } catch (e) {
      // fail silently
      console.warn(`AudioService: failed to play ${sound}`, e);
    }
  }

  async preload<S extends Sound>(sound: S): Promise<void> {
    try {
      const src = soundMap[sound];
      if (!src) return;
      await Audio.Sound.createAsync(src);
      // unload immediately but keep reference for later play
      // In practice we could keep a map of preloaded sounds
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