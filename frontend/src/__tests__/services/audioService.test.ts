import { AudioService } from '../services/audioService';

describe('AudioService', () => {
  // Mock Audio.Sound API
  const mockCreateAsync = jest.fn();
  const mockPlayAsync = jest.fn();
  const mockSetOnEnd = jest.fn();
  const mockUnloadAsync = jest.fn();

  beforeAll(() => {
    // @ts-ignore
    jest.spyOn(Audio.Sound, 'createAsync').mockImplementation(mockCreateAsync);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should play appointment-success sound', async () => {
    // Arrange
    mockCreateAsync.mockResolvedValue({} as any);
    mockPlayAsync.mockResolvedValue(undefined);
    mockSetOnEnd.mockImplementation(() => {});
    mockUnloadAsync.mockResolvedValue(undefined);

    // Act
    await (await new AudioService()).play('appointment-success');

    // Assert
    expect(mockCreateAsync).toHaveBeenCalledWith('../assets/audio/appointment-success.mp3');
    expect(mockPlayAsync).toHaveBeenCalled();
    expect(mockSetOnEnd).toHaveBeenCalled();
    expect(mockUnloadAsync).toHaveBeenCalled();
  });

  it('should do nothing if sound is not defined', async () => {
    // Arrange
    mockCreateAsync.mockResolvedValue(undefined as any);

    // Act
    await (await new AudioService()).play('non-existent-sound');

    // Assert
    expect(mockCreateAsync).not.toHaveBeenCalled();
  });

  it('should handle errors silently', async () => {
    // Arrange
    mockCreateAsync.mockRejectedValueOnce(new Error('Network error'));

    // Act
    await (await new AudioService()).play('action-success');

    // Assert
    expect(mockCreateAsync).toHaveBeenCalled();
    // No errors thrown
  });

  it('should preload sound', async () => {
    // Arrange
    mockCreateAsync.mockResolvedValue({} as any);
    mockPlayAsync.mockResolvedValue(undefined);
    mockSetOnEnd.mockImplementation(() => {});
    mockUnloadAsync.mockResolvedValue(undefined);

    // Act
    await (await new AudioService()).preload('action-success');

    // Assert
    expect(mockCreateAsync).toHaveBeenCalledWith('../assets/audio/action-success.mp3');
  });

  it('should cleanup players', async () => {
    // Arrange
    const player = {} as any;
    (await new AudioService()).pendingPlayers.add(player);
    mockUnloadAsync.mockResolvedValue(undefined);

    // Act
    await (await new AudioService()).cleanup();

    // Assert
    expect(mockUnloadAsync).toHaveBeenCalledWith(player);
    expect((await new AudioService()).pendingPlayers.size).toBe(0);
  });
});