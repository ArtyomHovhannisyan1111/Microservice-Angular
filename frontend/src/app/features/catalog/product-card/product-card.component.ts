import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../core/models/product.model';
import { ImageUrlPipe, IMAGE_PLACEHOLDER } from '../../../core/pipes/image-url.pipe';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, ImageUrlPipe],
  template: `
    <div class="card flex flex-col overflow-hidden group hover:shadow-md transition-shadow duration-200">
      <!-- Image -->
      <div class="relative overflow-hidden bg-gray-100 dark:bg-gray-700 h-48">
        <img
          [src]="(product.imageUrl ?? product.image) | imageUrl"
          [alt]="product.name"
          class="w-full h-48 object-cover object-center group-hover:scale-105 transition-transform duration-300"
          (error)="onImgError($event)">

        <!-- Category badge -->
        <span class="absolute top-2 left-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
                     text-xs font-medium px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">
          {{ product.category }}
        </span>

        <!-- Out of stock overlay -->
        @if (product.stock === 0) {
          <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span class="bg-white text-gray-800 font-semibold text-sm px-3 py-1.5 rounded-full shadow">
              Нет в наличии
            </span>
          </div>
        }

        <!-- Admin: delete button -->
        @if (auth.isAdmin()) {
          <button (click)="deleteProduct.emit(product.id); $event.stopPropagation()"
                  class="absolute top-2 right-2 w-7 h-7 flex items-center justify-center
                         bg-red-500 hover:bg-red-600 text-white rounded-full shadow
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        }
      </div>

      <!-- Content -->
      <div class="flex flex-col flex-1 p-4">
        <h3 class="font-semibold text-gray-900 dark:text-white line-clamp-1">{{ product.name }}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 flex-1">
          {{ product.description }}
        </p>

        <!-- Star rating -->
        <div class="flex items-center gap-0.5 mt-2">
          @for (star of stars; track $index) {
            <svg class="w-4 h-4"
                 [class]="$index < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'"
                 fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          }
          <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">{{ product.rating }}</span>
          <span class="text-xs text-gray-400 dark:text-gray-600 ml-1">({{ product.stock }} шт.)</span>
        </div>

        <!-- Price + Add to cart -->
        <div class="flex items-center justify-between mt-4 gap-2">
          <span class="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
            {{ product.price | number:'1.0-0' }} ₽
          </span>
          @if (!auth.isAdmin()) {
            <button
              (click)="onAdd()"
              [disabled]="product.stock === 0 || added()"
              class="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg
                     transition-all duration-200 flex-shrink-0"
              [class]="added()
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : product.stock === 0
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 cursor-not-allowed'
                  : 'btn-primary'">
              @if (added()) {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Добавлено
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                В корзину
              }
            </button>
          }
        </div>
      </div>
    </div>
  `
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() addToCart    = new EventEmitter<Product>();
  @Output() deleteProduct = new EventEmitter<string>();

  readonly auth  = inject(AuthService);
  readonly stars = [0, 1, 2, 3, 4];
  readonly added = signal(false);
  readonly Math  = Math;

  onAdd(): void {
    this.addToCart.emit(this.product);
    this.added.set(true);
    setTimeout(() => this.added.set(false), 2000);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = IMAGE_PLACEHOLDER;
  }
}
