import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { Order, OrderStatus } from '../../core/models/order.model';
import { Product } from '../../core/models/product.model';
import { ImageUrlPipe, IMAGE_PLACEHOLDER } from '../../core/pipes/image-url.pipe';

type Tab = 'orders' | 'products';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUrlPipe],
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
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Панель администратора</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Управление товарами и заказами</p>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        @for (stat of stats(); track stat.label) {
          <div class="card p-4 text-center">
            <p class="text-2xl font-bold" [class]="stat.color">{{ stat.value }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ stat.label }}</p>
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
          Заказы ({{ orders().length }})
        </button>
        <button (click)="activeTab.set('products')"
                [class]="activeTab() === 'products'
                  ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
                class="px-6 py-3 text-sm font-medium transition-colors duration-200">
          Товары ({{ products().length }})
        </button>
      </div>

      <!-- ── ORDERS TAB ─────────────────────────────────────────────────────── -->
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
          <p class="text-center text-gray-500 dark:text-gray-400 py-12">Заказов нет</p>
        } @else {
          <div class="card overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th class="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Номер</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Получатель</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Дата</th>
                    <th class="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Сумма</th>
                    <th class="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Статус</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  @for (order of orders(); track order.id) {
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                      <td class="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">
                        {{ order.id }}
                      </td>
                      <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {{ order.shippingAddress.fullName }}
                      </td>
                      <td class="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {{ order.createdAt | date:'dd.MM.yy HH:mm' }}
                      </td>
                      <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        {{ order.total | number:'1.0-0' }} ₽
                      </td>
                      <td class="px-4 py-3 text-center">
                        <select [value]="order.status"
                                (change)="onStatusChange(order, $event)"
                                class="text-xs rounded-lg border border-gray-300 dark:border-gray-600
                                       bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                                       px-2 py-1 cursor-pointer focus:outline-none focus:ring-1
                                       focus:ring-primary-500">
                          <option value="pending">Ожидает</option>
                          <option value="processing">Обрабатывается</option>
                          <option value="shipped">Отправлен</option>
                          <option value="delivered">Доставлен</option>
                          <option value="cancelled">Отменён</option>
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

      <!-- ── PRODUCTS TAB ────────────────────────────────────────────────────── -->
      @if (activeTab() === 'products') {
        <!-- Add product form -->
        <div class="card p-6 mb-6">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Добавить новый товар</h3>
          <form [formGroup]="productForm" (ngSubmit)="addProduct()" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Название</label>
              <input formControlName="name" type="text" class="input-field" placeholder="Название товара"
                     [class.border-red-500]="pf['name'].invalid && pf['name'].touched">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Категория</label>
              <input formControlName="category" type="text" class="input-field" placeholder="Электроника">
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Описание</label>
              <input formControlName="description" type="text" class="input-field" placeholder="Описание товара">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Цена (₽)</label>
              <input formControlName="price" type="number" class="input-field" placeholder="0" min="0">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Остаток (шт.)</label>
              <input formControlName="stock" type="number" class="input-field" placeholder="0" min="0">
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                URL изображения
                <span class="text-xs text-gray-400 font-normal ml-1">(полный URL или /images/product.jpg)</span>
              </label>
              <input formControlName="imageUrl" type="text" class="input-field"
                     placeholder="https://... или /images/product.jpg">
            </div>
            <div class="sm:col-span-2 flex items-center gap-3">
              <button type="submit" [disabled]="productForm.invalid || addingProduct()"
                      class="btn-primary flex items-center gap-2">
                @if (addingProduct()) {
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                }
                {{ addingProduct() ? 'Добавление...' : 'Добавить товар' }}
              </button>
              @if (addSuccess()) {
                <span class="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Товар добавлен
                </span>
              }
            </div>
          </form>
        </div>

        <!-- Products table -->
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
                    <th class="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Товар</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Категория</th>
                    <th class="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Цена</th>
                    <th class="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Остаток</th>
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
                        <span [class]="product.stock > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-500'">
                          {{ product.stock }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-center">
                        <button (click)="onDeleteProduct(product.id)"
                                class="text-red-400 hover:text-red-600 dark:hover:text-red-400
                                       transition-colors p-1 rounded">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
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
  private fb             = inject(FormBuilder);

  readonly activeTab      = signal<Tab>('orders');
  readonly orders         = signal<Order[]>([]);
  readonly products       = signal<Product[]>([]);
  readonly loadingOrders  = signal(true);
  readonly loadingProducts = signal(true);
  readonly addingProduct  = signal(false);
  readonly addSuccess     = signal(false);

  readonly stats = signal([
    { label: 'Всего заказов',     value: 0, color: 'text-primary-600 dark:text-primary-400' },
    { label: 'Ожидают',           value: 0, color: 'text-yellow-600 dark:text-yellow-400' },
    { label: 'Доставлено',        value: 0, color: 'text-green-600 dark:text-green-400'   },
    { label: 'Товаров в каталоге', value: 0, color: 'text-purple-600 dark:text-purple-400' },
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

  // ─── Orders ────────────────────────────────────────────────────────────────

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

  // ─── Products ──────────────────────────────────────────────────────────────

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
    await firstValueFrom(this.productService.deleteProduct(productId));
    this.products.update(list => list.filter(p => p.id !== productId));
    this.updateStats(this.orders(), this.products().length);
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  private updateStats(orders: Order[], productCount: number): void {
    this.stats.set([
      { label: 'Всего заказов',     value: orders.length,                               color: 'text-primary-600 dark:text-primary-400' },
      { label: 'Ожидают',           value: orders.filter(o => o.status === 'pending').length, color: 'text-yellow-600 dark:text-yellow-400' },
      { label: 'Доставлено',        value: orders.filter(o => o.status === 'delivered').length, color: 'text-green-600 dark:text-green-400' },
      { label: 'Товаров в каталоге', value: productCount,                                color: 'text-purple-600 dark:text-purple-400' },
    ]);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = IMAGE_PLACEHOLDER;
  }
}
