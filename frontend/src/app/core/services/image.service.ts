import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, filter, map } from 'rxjs';
import { API_BASE_URL } from '../tokens/api.token';
import {
  ImageUploadEvent,
  ImageUploadResponse,
  MultipleUploadResponse,
} from '../models/image.model';

@Injectable({ providedIn: 'root' })
export class ImageService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  upload(file: File, folder: string): Observable<ImageUploadEvent> {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);

    return this.http
      .request<ImageUploadResponse>(
        new HttpRequest('POST', `${this.baseUrl}/api/image/upload`, form, {
          reportProgress: true,
        })
      )
      .pipe(
        map(event => {
          if (event.type === HttpEventType.UploadProgress) {
            return {
              type:     'progress' as const,
              progress: Math.round(100 * event.loaded / (event.total ?? event.loaded)),
            };
          }
          if (event.type === HttpEventType.Response && event.body) {
            return { type: 'success' as const, response: event.body };
          }
          return null;
        }),
        filter((e): e is ImageUploadEvent => e !== null)
      );
  }

  uploadMultiple(files: File[], folder: string): Observable<MultipleUploadResponse> {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    form.append('folder', folder);
    return this.http.post<MultipleUploadResponse>(
      `${this.baseUrl}/api/image/upload-multiple`, form
    );
  }

  // fileName = "products/uuid_name.jpg" → full access URL
  getImageUrl(fileName: string): string {
    return `${this.baseUrl}/api/image/${fileName}`;
  }
}
