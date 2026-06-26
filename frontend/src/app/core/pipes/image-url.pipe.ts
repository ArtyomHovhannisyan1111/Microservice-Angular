import { Pipe, PipeTransform, inject } from '@angular/core';
import { API_BASE_URL } from '../tokens/api.token';

export const IMAGE_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
    '<rect width="400" height="300" fill="#f3f4f6"/>' +
    '<g transform="translate(200,145)">' +
    '<rect x="-45" y="-40" width="90" height="70" rx="8" fill="#e5e7eb"/>' +
    '<circle cx="18" cy="-18" r="14" fill="#d1d5db"/>' +
    '<path d="M-40 30L-12-8L12 12L28-14L50 30Z" fill="#d1d5db"/>' +
    '</g>' +
    '<text x="200" y="235" text-anchor="middle" fill="#9ca3af" ' +
    'font-size="13" font-family="system-ui,sans-serif">Нет изображения</text>' +
    '</svg>'
  );

@Pipe({ name: 'imageUrl', standalone: true, pure: true })
export class ImageUrlPipe implements PipeTransform {
  private readonly baseUrl = inject(API_BASE_URL);

  transform(value: string | null | undefined): string {
    if (!value) return IMAGE_PLACEHOLDER;
    // Already an absolute URL or data URI → pass through
    if (value.startsWith('http') || value.startsWith('//') || value.startsWith('data:')) {
      return value;
    }
    // Relative path from backend → prepend base URL
    return `${this.baseUrl}${value.startsWith('/') ? '' : '/'}${value}`;
  }
}
