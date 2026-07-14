import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Product } from '../models/product.model';
import { API_BASE_URL } from '../tokens/api.token';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getProducts(category?: string): Observable<Product[]> {
    const params: Record<string, string> = category ? { category } : {};
    return this.http.get<any[]>(`${this.baseUrl}/api/products`, { params }).pipe(
      map(items => items.map(p => this.normalize(p))),
      catchError(() => of([] as Product[]))
    );
  }

  getProduct(id: string): Observable<Product | undefined> {
    return this.http.get<any>(`${this.baseUrl}/api/products/${id}`).pipe(
      map(p => this.normalize(p)),
      catchError(() => of(undefined))
    );
  }

  private normalize(p: any): Product {
    return {
      id:          String(p.id),
      name:        p.name ?? '',
      description: p.description ?? p.name ?? '',
      price:       p.price ?? 0,
      imageUrl:    p.imageUrl ?? p.image,
      image:       p.image,
      category:    p.category ?? 'Товары',
      rating:      p.rating ?? 4.0,
      stock:       p.stock ?? p.quantity ?? 0,
    };
  }

  createProduct(data: Omit<Product, 'id'>): Observable<Product> {
    const body = { ...data, quantity: data.stock };
    return this.http.post<Product>(`${this.baseUrl}/api/products`, body);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/products/${id}`);
  }

  getProductsPaged(page: number, size = 10, search = '', category = ''): Observable<{ items: Product[]; totalPages: number; totalElements: number }> {
    const params: Record<string, string> = { page: String(page), size: String(size) };
    if (search.trim())   params['name']     = search.trim();
    if (category.trim()) params['category'] = category.trim();
    return this.http.get<any>(`${this.baseUrl}/api/products/page`, { params }).pipe(
      map(res => ({
        items: (res.content as any[]).map(p => this.normalize(p)),
        totalPages: res.totalPages,
        totalElements: res.totalElements
      })),
      catchError(() => of({
        items: [] as Product[],
        totalPages: 0,
        totalElements: 0
      }))
    );
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/api/products/categories`).pipe(
      catchError(() => of([] as string[]))
    );
  }
}