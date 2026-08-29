import { AudioService } from '../../services/audioService';

describe('AudioService', () => {
  it('should instantiate without errors', () => {
    const service = new AudioService();
    expect(service).toBeDefined();
  });

  it('should handle play without crashing when audio files are missing', async () => {
    const service = new AudioService();
    await expect(service.play('appointment-success')).resolves.toBeUndefined();
  });

  it('should handle preload without crashing when audio files are missing', async () => {
    const service = new AudioService();
    await expect(service.preload('action-success')).resolves.toBeUndefined();
  });

  it('should handle cleanup without errors', async () => {
    const service = new AudioService();
    await expect(service.cleanup()).resolves.toBeUndefined();
  });

  it('should handle all sound types', async () => {
    const service = new AudioService();
    const sounds = ['appointment-success', 'action-success', 'action-error', 'notification', 'cancel', 'reschedule'] as const;

    for (const sound of sounds) {
      await expect(service.play(sound)).resolves.toBeUndefined();
    }
  });
});
