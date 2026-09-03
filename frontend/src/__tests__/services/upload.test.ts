import { updateProfileAvatar, updateServiceImage, deleteServiceImage } from '@services/api';

jest.mock('expo-file-system', () => {
  const MockFile = jest.fn().mockImplementation((uri: string) => ({
    uri,
    exists: true,
    type: 'image/jpeg',
    size: 1024,
    base64: jest.fn().mockResolvedValue(btoa('mock-image-data')),
  }));
  return { File: MockFile };
});

jest.mock('../../supabase/client', () => {
  const mockUpload = jest.fn().mockResolvedValue({ error: null });
  const mockGetPublicUrl = jest.fn().mockReturnValue({
    data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/avatars/user-1/123.jpg' },
  });
  const mockRemove = jest.fn().mockResolvedValue({ error: null });
  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockSingle = jest.fn();

  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ select: mockSelect, single: mockSingle, order: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ maybeSingle: mockSingle }) }) });
  mockSingle.mockResolvedValue({ data: null, error: null });

  return {
    supabase: {
      storage: {
        from: jest.fn(() => ({
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl,
          remove: mockRemove,
        })),
      },
      from: jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockSingle,
            select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: mockSingle }) }),
          })),
        })),
        select: mockSelect,
      })),
    },
  };
});

import { supabase } from '../../supabase/client';

describe('upload services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfileAvatar', () => {
    it('should upload image and update profile avatar_url', async () => {
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      const mockUpload = jest.fn().mockResolvedValue({ error: null });
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/avatars/user-1/123.jpg' },
      });
      mockStorageFrom.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      const mockFrom = supabase.from as jest.Mock;
      const mockUpdateChain = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      };
      mockFrom.mockReturnValue(mockUpdateChain);

      const result = await updateProfileAvatar('user-1', 'file:///tmp/photo.jpg');

      expect(result).toBe('https://example.supabase.co/storage/v1/object/public/avatars/user-1/123.jpg');
      expect(mockStorageFrom).toHaveBeenCalledWith('avatars');
      expect(mockUpload).toHaveBeenCalledTimes(1);
      expect(mockGetPublicUrl).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('should throw when upload fails', async () => {
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      mockStorageFrom.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: { message: 'Bucket not found' } }),
        getPublicUrl: jest.fn(),
      });

      await expect(updateProfileAvatar('user-1', 'file:///tmp/photo.jpg'))
        .rejects.toThrow('Erro ao enviar imagem: Bucket not found');
    });

    it('should throw when file does not exist', async () => {
      const { File: MockFile } = require('expo-file-system');
      MockFile.mockImplementationOnce(() => ({
        uri: 'file:///tmp/nonexistent.jpg',
        exists: false,
      }));

      await expect(updateProfileAvatar('user-1', 'file:///tmp/nonexistent.jpg'))
        .rejects.toThrow('O arquivo de imagem selecionado nao existe.');
    });

    it('should detect png mime type correctly', async () => {
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      const mockUpload = jest.fn().mockResolvedValue({ error: null });
      mockStorageFrom.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/img.png' } }),
      });

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      });

      await updateProfileAvatar('user-1', 'file:///tmp/photo.png');

      const uploadCall = mockUpload.mock.calls[0];
      const options = uploadCall[2];
      expect(options.contentType).toBe('image/png');
    });
  });

  describe('updateServiceImage', () => {
    it('should upload image and update service image_url', async () => {
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      const mockUpload = jest.fn().mockResolvedValue({ error: null });
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/service-images/svc-1/123.jpg' },
      });
      mockStorageFrom.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const result = await updateServiceImage('svc-1', 'file:///tmp/service.jpg');

      expect(result).toBe('https://example.supabase.co/storage/v1/object/public/service-images/svc-1/123.jpg');
      expect(mockStorageFrom).toHaveBeenCalledWith('service-images');
      expect(mockUpload).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledWith('services');
    });

    it('should throw when upload fails', async () => {
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      mockStorageFrom.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: { message: 'Storage error' } }),
        getPublicUrl: jest.fn(),
      });

      await expect(updateServiceImage('svc-1', 'file:///tmp/photo.jpg'))
        .rejects.toThrow('Erro ao enviar imagem: Storage error');
    });
  });

  describe('deleteServiceImage', () => {
    it('should remove image file and clear image_url', async () => {
      const mockFrom = supabase.from as jest.Mock;
      const mockRemove = jest.fn().mockResolvedValue({ error: null });
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      mockStorageFrom.mockReturnValue({ remove: mockRemove });

      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { image_url: 'https://example.co/storage/v1/object/public/service-images/svc-1/123.jpg' },
              error: null,
            }),
          }),
        }),
      });

      mockFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await deleteServiceImage('svc-1');

      expect(mockStorageFrom).toHaveBeenCalledWith('service-images');
      expect(mockRemove).toHaveBeenCalledWith(['svc-1/123.jpg']);
    });

    it('should do nothing if service has no image', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { image_url: null },
              error: null,
            }),
          }),
        }),
      });

      await deleteServiceImage('svc-1');
    });
  });
});
