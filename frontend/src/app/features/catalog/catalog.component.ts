import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductCardComponent } from './product-card/product-card.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ProductCardComponent, TranslateModule],
  template: `
    <div>
      <!-- Header -->
      <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ 'CATALOG.TITLE' | translate }}</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            {{ searchQuery ? filteredProducts().length + ' ' + ('COMMON.OF' | translate) + ' ' + totalElements() : totalElements() }} {{ 'CATALOG.PRODUCTS' | translate }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Search -->
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange()"
                   type="text" [placeholder]="'COMMON.SEARCH' | translate" class="input-field pl-10 w-56">
          </div>
          <!-- Admin: add product button -->
          @if (auth.isAdmin()) {
            <a routerLink="/admin"
               class="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600
                      text-white text-sm font-medium rounded-lg transition-colors duration-200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              {{ 'CATALOG.ADD_PRODUCT' | translate }}
            </a>
          }
        </div>
      </div>
      </div>

      <!-- Skeleton loading: only on initial load when no products yet -->
      @if (loading() && filteredProducts().length === 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (i of skeletons; track i) {
            <div class="card overflow-hidden animate-pulse">
              <div class="bg-gray-200 dark:bg-gray-700 aspect-[4/3]"></div>
              <div class="p-4 space-y-3">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div class="flex justify-between items-center pt-2">
                  <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Error state -->
      @if (!loading() && error()) {
        <div class="text-center py-20 card">
          <svg class="w-16 h-16 text-red-300 dark:text-red-700 mx-auto mb-4"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          <p class="text-gray-600 dark:text-gray-300 font-medium mb-4">{{ error()! | translate }}</p>
          <button (click)="loadProducts(currentPage())"
                  class="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
            {{ 'COMMON.RETRY' | translate }}
          </button>
        </div>
      }

      <!-- Products grid: stays visible during subsequent loads -->
      @if (!error() && filteredProducts().length > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
             [class.opacity-60]="loading()" [class.pointer-events-none]="loading()">
          @for (product of filteredProducts(); track product.id) {
            <app-product-card
              [product]="product"
              (addToCart)="onAddToCart($event)"
              (deleteProduct)="onDeleteProduct($event)" />
          }
        </div>
      }

      <!-- Empty state: only when not loading -->
      @if (!loading() && !error() && filteredProducts().length === 0) {
        <div class="text-center py-20 card">
          <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-gray-500 dark:text-gray-400 font-medium">{{ 'CATALOG.NOT_FOUND' | translate }}</p>
          <button (click)="resetFilters()"
                  class="mt-4 text-primary-600 dark:text-primary-400 text-sm hover:underline">
            {{ 'CATALOG.RESET_FILTERS' | translate }}
          </button>
        </div>
      }

      <!-- Pagination -->
      @if (!error() && totalPages() > 1) {
        <div class="flex items-center justify-center gap-1 mt-10">
          <button (click)="goToPage(currentPage() - 1)"
                  [disabled]="currentPage() === 0"
                  class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300
                         dark:border-gray-600 text-gray-600 dark:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40
                         disabled:cursor-not-allowed transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          @for (page of pageNumbers(); track page) {
            @if (page === -1) {
              <span class="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">…</span>
            } @else {
              <button (click)="goToPage(page)"
                      class="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors"
                      [class]="page === currentPage()
                        ? 'bg-primary-600 text-white border border-primary-600'
                        : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'">
                {{ page + 1 }}
              </button>
            }
          }

          <button (click)="goToPage(currentPage() + 1)"
                  [disabled]="currentPage() === totalPages() - 1"
                  class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300
                         dark:border-gray-600 text-gray-600 dark:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40
                         disabled:cursor-not-allowed transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      }

      <!-- Toast -->
      @if (toastVisible()) {
        <div class="fixed bottom-6 right-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900
                    px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50
                    animate-[fadeInUp_0.3s_ease-out]">
          <svg class="w-5 h-5 text-green-400 dark:text-green-600 flex-shrink-0"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <span class="text-sm font-medium">{{ toastMessage() }}</span>
          <a routerLink="/cart" class="text-primary-400 dark:text-primary-600 text-sm hover:underline flex-shrink-0">
            {{ 'CART.TITLE' | translate }}
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(1rem); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class CatalogComponent implements OnInit {
  private productService  = inject(ProductService);
  private cartService     = inject(CartService);
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private destroyRef      = inject(DestroyRef);
  private translateService = inject(TranslateService);
  readonly auth           = inject(AuthService);

  readonly loading          = signal(true);
  readonly error            = signal<string | null>(null);
  readonly filteredProducts = signal<Product[]>([]);
  readonly selectedCategory = signal('');
  readonly toastVisible     = signal(false);
  readonly toastMessage     = signal('');
  readonly currentPage      = signal(0);
  readonly totalPages       = signal(0);
  readonly totalElements    = signal(0);

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur   = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const pages: number[] = [];
    const addPage = (p: number) => { if (!pages.includes(p)) pages.push(p); };
    [0, 1].forEach(addPage);
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 3, cur + 1); i++) addPage(i);
    [total - 2, total - 1].forEach(addPage);
    const result: number[] = [];
    pages.sort((a, b) => a - b).forEach((p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) result.push(-1);
      result.push(p);
    });
    return result;
  });

  readonly skeletons = Array(10).fill(0);
  private allProducts: Product[] = [];
  searchQuery = '';

  private searchTimeout: any;
  private loadRequestId = 0;

  ngOnInit(): void {
    this.route.queryParamMap.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      const cat = params.get('category') ?? '';
      this.selectedCategory.set(cat);
      this.loadProducts(0);
    });
  }

  async loadProducts(page = 0): Promise<void> {
    const requestId = ++this.loadRequestId;
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.productService.getProductsPaged(page, 10, this.searchQuery, this.selectedCategory()));
      if (requestId !== this.loadRequestId) return;
      this.allProducts = res.items;
      this.currentPage.set(page);
      this.totalPages.set(res.totalPages);
      this.totalElements.set(res.totalElements);
      this.filteredProducts.set(res.items);
    } catch {
      if (requestId !== this.loadRequestId) return;
      if (this.allProducts.length === 0) {
        this.error.set('CATALOG.LOAD_ERROR');
      } else {
        this.showToast(this.translateService.instant('CATALOG.REFRESH_FAILED'));
      }
    } finally {
      if (requestId === this.loadRequestId) {
        this.loading.set(false);
      }
    }
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadProducts(0), 400);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.loadProducts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  selectCategory(cat: string): void {
    this.router.navigate([], { queryParams: cat ? { category: cat } : {}, relativeTo: this.route });
  }

  filterProducts(): void {
    this.filteredProducts.set(this.allProducts);
  }

  resetFilters(): void {
    this.searchQuery = '';
    if (this.selectedCategory()) {
      this.router.navigate([], { queryParams: {}, relativeTo: this.route });
    } else {
      this.loadProducts(0);
    }
  }

  onAddToCart(product: Product): void {
    this.cartService.addToCart(product);
    this.showToast(`«${product.name}» ${this.translateService.instant('CATALOG.ADDED_TO_CART')}`);
  }

  async onDeleteProduct(productId: string): Promise<void> {
    const backup = this.allProducts;
    this.allProducts = this.allProducts.filter(p => p.id !== productId);
    this.filterProducts();
    try {
      await firstValueFrom(this.productService.deleteProduct(productId));
      this.showToast(this.translateService.instant('CATALOG.PRODUCT_DELETED'));
    } catch {
      this.allProducts = backup;
      this.filterProducts();
      this.showToast(this.translateService.instant('CATALOG.LOAD_ERROR'));
    }
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3000);
  }
}
