import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CartItem } from '../models/cart.model';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly STORAGE_KEY = 'cart_v2';

  /** Источник истины — синхронизирован с localStorage */
  private readonly subject = new BehaviorSubject<CartItem[]>(this.loadFromStorage());

  // ─── Реактивные потоки ────────────────────────────────────────────────────
  readonly items$     = this.subject.asObservable();
  readonly itemCount$ = this.items$.pipe(map(items => items.reduce((n, i) => n + i.quantity, 0)));
  readonly total$     = this.items$.pipe(map(items => items.reduce((n, i) => n + i.product.price * i.quantity, 0)));

  // ─── Signal-обёртки для шаблонов (items(), itemCount(), total()) ──────────
  readonly items     = toSignal(this.items$,     { initialValue: [] as CartItem[] });
  readonly itemCount = toSignal(this.itemCount$, { initialValue: 0 });
  readonly total     = toSignal(this.total$,     { initialValue: 0 });

  addToCart(product: Product): void {
    const current = this.subject.value;
    const idx = current.findIndex(i => i.product.id === product.id);
    const next = idx >= 0
      ? current.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...current, { product, quantity: 1 }];
    this.emit(next);
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) { this.removeFromCart(productId); return; }
    this.emit(this.subject.value.map(i => i.product.id === productId ? { ...i, quantity } : i));
  }

  removeFromCart(productId: string): void {
    this.emit(this.subject.value.filter(i => i.product.id !== productId));
  }

  clearCart(): void {
    this.emit([]);
  }

  // ─── Private ───────────────────────────────────────────────────────────────
  private emit(items: CartItem[]): void {
    this.subject.next(items);
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items)); } catch { /* storage quota */ }
  }

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch { return []; }
  }
}
