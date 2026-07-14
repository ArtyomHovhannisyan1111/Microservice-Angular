import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { ImageService } from '../../core/services/image.service';
import { Order, OrderStatus } from '../../core/models/order.model';
import { Product } from '../../core/models/product.model';
import { ImageUrlPipe, IMAGE_PLACEHOLDER } from '../../core/pipes/image-url.pipe';

type Tab = 'orders' | 'products';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUrlPipe, TranslateModule],
  template: `
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-8">
        <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ 'ADMIN.TITLE' | translate }}</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ 'ADMIN.SUBTITLE' | translate }}</p>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        @for (stat of stats(); track stat.labelKey) {
          <div class="card p-4 text-center">
            <p class="text-2xl font-bold" [class]="stat.color">{{ stat.value }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ stat.labelKey | translate }}</p>
          </div>
        }
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button (click)="activeTab.set('orders')"
                [class]="activeTab() === 'orders'
                  ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
                class="px-6 py-3 text-sm font-medium transition-colors duration-200">
          {{ 'NAV.ADMIN_ORDERS' | translate }} ({{ orders().length }})
        </button>
        <button (click)="activeTab.set('products')"
                [class]="activeTab() === 'products'
                  ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
                class="px-6 py-3 text-sm font-medium transition-colors duration-200">
          {{ 'NAV.ADMIN_PRODUCTS' | translate }} ({{ products().length }})
        </button>
      </div>

      <!-- ORDERS TAB -->
      @if (activeTab() === 'orders') {
        @if (loadingOrders()) {
          <div class="space-y-3">
            @for (i of [1,2,3,4]; track i) {
              <div class="card p-4 animate-pulse flex justify-between">
                <div class="space-y-2 flex-1">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
                <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
              </div>
            }
          </div>
        } @else if (orders().length === 0) {
          <p class="text-center text-gray-500 dark:text-gray-400 py-12">{{ 'ADMIN.NO_ORDERS' | translate }}</p>
        } @else {
          <div class="card overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th class="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{{ 'ADMIN.COL_NUM' | translate }}</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{{ 'ADMIN.COL_USER' | translate }}</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{{ 'ADMIN.COL_PRODUCT_QTY' | translate }}</th>
                    <th class="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{{ 'ADMIN.COL_AMOUNT' | translate }}</th>
                    <th class="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{{ 'ADMIN.COL_STATUS' | translate }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  @for (order of orders(); track order.id) {
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                      <td class="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">
                        {{ order.id }}
                      </td>
                      <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {{ order.userName ?? ('ADMIN_ORDERS.UNKNOWN_USER' | translate: { id: order.userId }) }}
                      </td>
                      <td class="px-4 py-3 text-gray-500 dark:text-gray-400">
                        #{{ order.productId }} × {{ order.quantity }}
                      </td>
                      <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        {{ order.totalPrice | number:'1.0-0' }} ₽
                      </td>
                      <td class="px-4 py-3 text-center">
                        <select [value]="order.status"
                                (change)="onStatusChange(order, $event)"
                                class="text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500">
                          <option value="pending">{{ 'STATUS.PENDING' | translate }}</option>
                          <option value="processing">{{ 'STATUS.PROCESSING' | translate }}</option>
                          <option value="shipped">{{ 'STATUS.SHIPPED' | translate }}</option>
                          <option value="delivered">{{ 'STATUS.DELIVERED' | translate }}</option>
                          <option value="cancelled">{{ 'STATUS.CANCELLED' | translate }}</option>
                        </select>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }

      <!-- PRODUCTS TAB -->
      @if (activeTab() === 'products') {
        <div class="card p-6 mb-6">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-4">{{ 'ADMIN.ADD_PRODUCT_TITLE' | translate }}</h3>
          <form [formGroup]="productForm" (ngSubmit)="addProduct()" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{{ 'ADMIN.PRODUCT_NAME' | translate }}</label>
              <input formControlName="name" type="text" class="input-field"
                     [placeholder]="'ADMIN.PRODUCT_NAME_PH' | translate"
                     [class.border-red-500]="pf['name'].invalid && pf['name'].touched">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{{ 'ADMIN.CATEGORY' | translate }}</label>
              <select formControlName="category" class="input-field">
                <option value="" disabled>Выберите категорию</option>
                @for (cat of categories; track cat) {
                  <option [value]="cat">{{ cat }}</option>
                }
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{{ 'ADMIN.DESCRIPTION' | translate }}</label>
              <input formControlName="description" type="text" class="input-field" [placeholder]="'ADMIN.DESCRIPTION_PH' | translate">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{{ 'ADMIN.PRICE' | translate }}</label>
              <input formControlName="price" type="number" class="input-field" placeholder="0" min="0">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{{ 'ADMIN.STOCK' | translate }}</label>
              <input formControlName="stock" type="number" class="input-field" placeholder="0" min="0">
            </div>

            <!-- Image field with upload button -->
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {{ 'ADMIN.IMAGE_URL' | translate }}
              </label>
              <div class="flex gap-2">
                <input formControlName="imageUrl" type="text" class="input-field flex-1"
                       [placeholder]="'ADMIN.IMAGE_URL_PH' | translate">
                <button type="button"
                        (click)="imgFileInput.click()"
                        [disabled]="imgUploading"
                        class="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors">
                  @if (imgUploading) {
                    <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    {{ imgProgress }}%
                  } @else {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                    </svg>
                    {{ 'ADMIN.UPLOAD_IMAGE' | translate }}
                  }
                </button>
              </div>
              <input #imgFileInput type="file" accept=".jpg,.jpeg,.png,.webp" class="hidden"
                     (change)="onImageFileChange($event)">
              @if (imgError) {
                <p class="mt-1 text-xs text-red-500">{{ 'ADMIN.IMAGE_UPLOAD_ERROR' | translate }}</p>
              }
              @if (pf['imageUrl'].value) {
                <img [src]="pf['imageUrl'].value | imageUrl"
                     class="mt-2 h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                     (error)="onImgError($event)">
              }
            </div>

            <div class="sm:col-span-2 flex items-center gap-3">
              <button type="submit" [disabled]="productForm.invalid || addingProduct()"
                      class="btn-primary flex items-center gap-2">
                @if (addingProduct()) {
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                }
                {{ (addingProduct() ? 'ADMIN.ADDING' : 'CATALOG.ADD_PRODUCT') | translate }}
              </button>
              @if (addSuccess()) {
                <span class="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  {{ 'ADMIN.PRODUCT_ADDED' | translate }}
                </span>
              }
            </div>
          </form>
        </div>

        @if (loadingProducts()) {
          <div class="card p-8 text-center">
            <div class="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        } @else {
          <div class="card overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th class="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{{ 'ADMIN.COL_PRODUCT' | translate }}</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{{ 'ADMIN.CATEGORY' | translate }}</th>
                    <th class="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{{ 'ADMIN.COL_PRICE' | translate }}</th>
                    <th class="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{{ 'ADMIN.COL_STOCK' | translate }}</th>
                    <th class="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-300"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  @for (product of products(); track product.id) {
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                          <img [src]="(product.imageUrl ?? product.image) | imageUrl"
                               [alt]="product.name"
                               class="w-10 h-10 object-cover rounded-lg bg-gray-100 dark:bg-gray-700"
                               (error)="onImgError($event)">
                          <span class="font-medium text-gray-900 dark:text-white">{{ product.name }}</span>
                        </div>
                      </td>
                      <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ product.category }}</td>
                      <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        {{ product.price | number:'1.0-0' }} ₽
                      </td>
                      <td class="px-4 py-3 text-center">
                        <span [class]="product.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                          {{ product.stock }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-center">
                        <button (click)="onDeleteProduct(product.id)"
                                class="text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class AdminPanelComponent implements OnInit {
  private orderService   = inject(OrderService);
  private productService = inject(ProductService);
  private imageService   = inject(ImageService);
  private fb             = inject(FormBuilder);

  private static readonly CATEGORY_KEYS: Record<string, string> = {
    'Электроника': 'CATEGORIES.ELECTRONICS',
    'Периферия':   'CATEGORIES.PERIPHERALS',
    'Мониторы':    'CATEGORIES.MONITORS',
    'Аудио':       'CATEGORIES.AUDIO',
    'Аксессуары':  'CATEGORIES.ACCESSORIES',
  };

  categories: string[] = ['Электроника', 'Периферия', 'Мониторы', 'Аудио', 'Аксессуары'];

  catKey(cat: string): string {
    return AdminPanelComponent.CATEGORY_KEYS[cat] ?? cat;
  }

  readonly activeTab       = signal<Tab>('orders');
  readonly orders          = signal<Order[]>([]);
  readonly products        = signal<Product[]>([]);
  readonly loadingOrders   = signal(true);
  readonly loadingProducts = signal(true);
  readonly addingProduct   = signal(false);
  readonly addSuccess      = signal(false);

  imgUploading = false;
  imgProgress  = 0;
  imgError     = false;

  readonly stats = signal([
    { labelKey: 'ADMIN.TOTAL_ORDERS', value: 0, color: 'text-primary-600 dark:text-primary-400' },
    { labelKey: 'ADMIN.PENDING',      value: 0, color: 'text-yellow-600 dark:text-yellow-400'  },
    { labelKey: 'ADMIN.DELIVERED',    value: 0, color: 'text-green-600 dark:text-green-400'    },
    { labelKey: 'ADMIN.CATALOG_COUNT',value: 0, color: 'text-purple-600 dark:text-purple-400'  },
  ]);

  productForm = this.fb.group({
    name:        ['', Validators.required],
    description: ['', Validators.required],
    category:    ['', Validators.required],
    price:       [0,  [Validators.required, Validators.min(1)]],
    stock:       [0,  [Validators.required, Validators.min(0)]],
    rating:      [4.0],
    imageUrl:    ['']
  });

  get pf() { return this.productForm.controls; }

  ngOnInit(): void {
    this.loadOrders();
    this.loadProducts();
  }

  private loadOrders(): void {
    this.orderService.getAllOrders().subscribe({
      next: orders => {
        this.orders.set(orders);
        this.loadingOrders.set(false);
        this.updateStats(orders, this.products().length);
      },
      error: () => this.loadingOrders.set(false)
    });
  }

  async onStatusChange(order: Order, event: Event): Promise<void> {
    const status = (event.target as HTMLSelectElement).value as OrderStatus;
    const updated = await firstValueFrom(this.orderService.updateOrderStatus(order.id, status));
    this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
    this.updateStats(this.orders(), this.products().length);
  }

  private loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: products => {
        this.products.set(products);
        this.loadingProducts.set(false);
        this.updateStats(this.orders(), products.length);
      },
      error: () => this.loadingProducts.set(false)
    });
  }

  async addProduct(): Promise<void> {
    if (this.productForm.invalid) { this.productForm.markAllAsTouched(); return; }
    this.addingProduct.set(true);
    const raw = this.productForm.getRawValue();
    const product = await firstValueFrom(
      this.productService.createProduct({
        name:        raw.name!,
        description: raw.description!,
        category:    raw.category!,
        price:       Number(raw.price),
        stock:       Number(raw.stock),
        rating:      raw.rating ?? 4.0,
        imageUrl:    raw.imageUrl || undefined,
        image:       raw.imageUrl || undefined
      })
    );
    this.products.update(list => [product, ...list]);
    this.productForm.reset({ rating: 4.0, price: 0, stock: 0 });
    this.addingProduct.set(false);
    this.addSuccess.set(true);
    setTimeout(() => this.addSuccess.set(false), 3000);
    this.updateStats(this.orders(), this.products().length);
  }

  async onDeleteProduct(productId: string): Promise<void> {
    try {
      await firstValueFrom(this.productService.deleteProduct(productId));
      this.products.update(list => list.filter(p => p.id !== productId));
      this.updateStats(this.orders(), this.products().length);
    } catch (err: any) {
      const status = err?.status;
      if (status === 403 || status === 401) {
        alert('Нет прав для удаления продукта. Войдите как администратор.');
      } else {
        alert('Ошибка при удалении продукта. Попробуйте ещё раз.');
      }
    }
  }

  onImageFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.imgUploading = true;
    this.imgProgress  = 0;
    this.imgError     = false;
    this.imageService.upload(file, 'products').subscribe({
      next: e => {
        if (e.type === 'progress') {
          this.imgProgress = e.progress;
        } else {
          this.pf['imageUrl'].setValue('/api/image/' + e.response.fileName);
          this.imgUploading = false;
        }
      },
      error: () => {
        this.imgUploading = false;
        this.imgError = true;
      }
    });
  }

  private updateStats(orders: Order[], productCount: number): void {
    this.stats.set([
      { labelKey: 'ADMIN.TOTAL_ORDERS', value: orders.length,                                       color: 'text-primary-600 dark:text-primary-400' },
      { labelKey: 'ADMIN.PENDING',      value: orders.filter(o => o.status === 'pending').length,   color: 'text-yellow-600 dark:text-yellow-400'  },
      { labelKey: 'ADMIN.DELIVERED',    value: orders.filter(o => o.status === 'delivered').length, color: 'text-green-600 dark:text-green-400'    },
      { labelKey: 'ADMIN.CATALOG_COUNT',value: productCount,                                        color: 'text-purple-600 dark:text-purple-400'  },
    ]);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = IMAGE_PLACEHOLDER;
  }
}
