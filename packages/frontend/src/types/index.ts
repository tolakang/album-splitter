export type AlbumStatus = 'PENDING' | 'DOWNLOADING' | 'PARSING' | 'SPLITTING' | 'COMPLETED' | 'FAILED';
export type TaskStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Album {
  id: string;
  title?: string;
  youtubeUrl?: string;
  status: AlbumStatus;
  progress: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  tasks: Task[];
  generatedFiles: GeneratedFile[];
}

export interface Task {
  id: string;
  albumId: string;
  status: TaskStatus;
  progress: number;
  queueId?: string;
  workerId?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedFile {
  id: string;
  albumId: string;
  filename: string;
  originalName?: string;
  size: number;
  downloaded: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface CreateAlbumRequest {
  title?: string;
  youtubeUrl?: string;
  artist?: string;
  albumName?: string;
  year?: number;
  tracks?: Track[];
}

export interface SplitRequest {
  tracks: Track[];
  outputFormat?: string;
}

export interface SplitResponse {
  jobId: string;
  albumId: string;
  message: string;
}

export interface Track {
  title: string;
  startTimestamp: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
