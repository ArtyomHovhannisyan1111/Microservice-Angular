import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review, ReviewRequest } from '../models/review.model';
import { API_BASE_URL } from '../tokens/api.token';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getReviews(productId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/api/products/${productId}/reviews`);
  }

  addReview(productId: string, request: ReviewRequest): Observable<Review> {
    return this.http.post<Review>(`${this.baseUrl}/api/products/${productId}/reviews`, request);
  }

  deleteReview(productId: string, reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/products/${productId}/reviews/${reviewId}`);
  }
}
