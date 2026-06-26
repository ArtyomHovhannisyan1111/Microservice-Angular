import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Product } from '../models/product.model';
import { API_BASE_URL } from '../tokens/api.token';

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Беспроводные наушники', description: 'Премиум качество звука с шумоподавлением', price: 14990, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', category: 'Электроника', rating: 4.5, stock: 10 },
  { id: '2', name: 'Умные часы', description: 'Фитнес-трекер с мониторингом сердечного ритма', price: 22990, imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80', category: 'Электроника', rating: 4.2, stock: 5 },
  { id: '3', name: 'Механическая клавиатура', description: 'RGB подсветка, переключатели Cherry MX Blue', price: 8990, imageUrl: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&q=80', category: 'Периферия', rating: 4.7, stock: 15 },
  { id: '4', name: 'Игровая мышь', description: 'DPI 16000, 7 программируемых кнопок', price: 4990, imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&q=80', category: 'Периферия', rating: 4.4, stock: 20 },
  { id: '5', name: 'Монитор 27"', description: '4K IPS, 144Hz, HDR400', price: 54990, imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80', category: 'Мониторы', rating: 4.8, stock: 3 },
  { id: '6', name: 'Веб-камера HD', description: '1080p, автофокус, микрофон с шумоподавлением', price: 5990, imageUrl: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?w=600&q=80', category: 'Периферия', rating: 4.1, stock: 8 },
  { id: '7', name: 'Портативная колонка', description: 'Bluetooth 5.0, 20 часов работы, IPX7', price: 6990, imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80', category: 'Аудио', rating: 4.6, stock: 12 },
  { id: '8', name: 'USB-C хаб 7-в-1', description: 'HDMI 4K, USB 3.0 ×3, SD, PD 100W', price: 3990, imageUrl: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&q=80', category: 'Аксессуары', rating: 4.3, stock: 25 },
];

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Admin-added products (before backend persists them) */
  private localProducts: Product[] = [];

  getProducts(category?: string): Observable<Product[]> {
    const params: Record<string, string> = category ? { category } : {};
    return this.http.get<Product[]>(`${this.baseUrl}/api/v1/products`, { params }).pipe(
      catchError(() => {
        const all = [...MOCK_PRODUCTS, ...this.localProducts];
        return of(category ? all.filter(p => p.category === category) : all);
      })
    );
  }

  getProduct(id: string): Observable<Product | undefined> {
    return this.http.get<Product>(`${this.baseUrl}/api/v1/products/${id}`).pipe(
      catchError(() => of([...MOCK_PRODUCTS, ...this.localProducts].find(p => p.id === id)))
    );
  }

  createProduct(data: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/api/v1/products`, data).pipe(
      catchError(() => {
        const product: Product = { ...data, id: `local-${Date.now()}` };
        this.localProducts.push(product);
        return of(product);
      })
    );
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/v1/products/${id}`).pipe(
      catchError(() => {
        this.localProducts = this.localProducts.filter(p => p.id !== id);
        return of(undefined);
      })
    );
  }

  getCategories(): string[] {
    const all = [...MOCK_PRODUCTS, ...this.localProducts];
    return [...new Set(all.map(p => p.category))];
  }
}
