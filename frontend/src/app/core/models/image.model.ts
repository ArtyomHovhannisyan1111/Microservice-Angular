export type FileUploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface QueuedFile {
  id: string;
  file: File;
  previewUrl: string;
  status: FileUploadStatus;
  progress: number;
  errorMessage?: string;
  uploadedFileName?: string;
  uploadedUrl?: string;
}

export interface ImageUploadResponse {
  fileName: string;
  fileType: string;
  size: number;
  status: string;
}

export interface MultipleUploadResponse {
  images: ImageUploadResponse[];
  totalFiles: number;
}

export interface UploadProgressEvent {
  readonly type: 'progress';
  readonly progress: number;
}

export interface UploadSuccessEvent {
  readonly type: 'success';
  readonly response: ImageUploadResponse;
}

export type ImageUploadEvent = UploadProgressEvent | UploadSuccessEvent;

export const IMAGE_CONFIG = {
  maxFileSizeBytes:  15 * 1024 * 1024,
  maxFiles:          20,
  acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  acceptedExtensions: '.jpg,.jpeg,.png,.webp',
  defaultFolder:     'products' as const,
  folders:           ['products', 'avatars', 'banners', 'categories', 'misc'] as const,
  concurrentUploads: 3,
} as const;

export type ImageFolder = typeof IMAGE_CONFIG.folders[number];
