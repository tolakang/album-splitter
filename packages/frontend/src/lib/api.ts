import { Album, CreateAlbumRequest, GeneratedFile } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  albums: {
    list: () => fetchAPI<Album[]>('/api/albums'),
    get: (id: string) => fetchAPI<Album>(`/api/albums/${id}`),
    create: (data: CreateAlbumRequest) => fetchAPI<Album>('/api/albums', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchAPI<void>(`/api/albums/${id}`, {
      method: 'DELETE',
    }),
  },

  upload: {
    file: async (albumId: string, file: File): Promise<{ path: string; filename: string }> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/upload/${albumId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(error.message || `Upload error: ${response.status}`);
      }

      return response.json();
    },
  },

  download: {
    file: (fileId: string) => `${API_BASE}/api/download/${fileId}`,
    zip: (albumId: string) => `${API_BASE}/api/download/zip/${albumId}`,
    deleteFile: (fileId: string) => fetchAPI<void>(`/api/download/${fileId}`, {
      method: 'DELETE',
    }),
  },

  cleanup: {
    trigger: () => fetchAPI<{ cleaned: number }>('/api/cleanup', {
      method: 'POST',
    }),
  },
};
