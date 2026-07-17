import { Album, CreateAlbumRequest, GeneratedFile, SplitRequest, SplitResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

function extractErrorMessage(error: any): string {
  if (error?.message && Array.isArray(error.message)) {
    return error.message.join(', ');
  }
  return error?.message || 'Unknown error';
}

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
    throw new Error(extractErrorMessage(error) || `API error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  albums: {
    list: () => fetchAPI<Album[]>('/albums'),
    get: (id: string) => fetchAPI<Album>(`/albums/${id}`),
    create: (data: CreateAlbumRequest) => fetchAPI<Album>('/albums', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchAPI<void>(`/albums/${id}`, {
      method: 'DELETE',
    }),
  },

  split: {
    trigger: (albumId: string, data: SplitRequest) =>
      fetchAPI<SplitResponse>(`/split/${albumId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  upload: {
    file: async (albumId: string, file: File): Promise<{ filename: string }> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/upload/${albumId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(extractErrorMessage(error) || `Upload error: ${response.status}`);
      }

      return response.json();
    },
  },

  download: {
    file: (fileId: string) => `${API_BASE}/download/${fileId}`,
    zip: (albumId: string) => `${API_BASE}/download/zip/${albumId}`,
    deleteFile: (fileId: string) => fetchAPI<void>(`/download/${fileId}`, {
      method: 'DELETE',
    }),
  },

  cleanup: {
    trigger: () => fetchAPI<{ cleaned: number }>('/cleanup', {
      method: 'POST',
    }),
  },
};
