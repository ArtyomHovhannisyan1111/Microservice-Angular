import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { Product } from '../../../core/models/product.model';
import { Review, ReviewRequest } from '../../../core/models/review.model';
import { ProductService } from '../../../core/services/product.service';
import { ReviewService } from '../../../core/services/review.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ImageUrlPipe, IMAGE_PLACEHOLDER } from '../../../core/pipes/image-url.pipe';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ImageUrlPipe, TranslateModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="max-w-5xl mx-auto px-4 py-8">

        <!-- Back link -->
        <a routerLink="/catalog"
           class="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400
                  hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-6">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          {{ 'REVIEW.BACK_TO_CATALOG' | translate }}
        </a>

        <!-- Loading skeleton -->
        @if (loading()) {
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 animate-pulse">
            <div class="flex flex-col md:flex-row gap-8">
              <div class="w-full md:w-80 h-72 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div class="flex-1 space-y-4">
                <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 mt-6"></div>
              </div>
            </div>
          </div>
        }

        <!-- Product card -->
        @if (!loading() && product()) {
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden mb-8">
            <div class="flex flex-col md:flex-row gap-0">

              <!-- Image -->
              <div class="md:w-80 bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                <img [src]="(product()!.imageUrl ?? product()!.image) | imageUrl"
                     [alt]="product()!.name"
                     (error)="onImgError($event)"
                     class="w-full h-72 md:h-full object-cover object-center">
              </div>

              <!-- Info -->
              <div class="flex-1 p-6 flex flex-col">
                <!-- Category -->
                <span class="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide mb-2">
                  {{ product()!.category }}
                </span>

                <!-- Name -->
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {{ product()!.name }}
                </h1>

                <!-- Description -->
                @if (product()!.description) {
                  <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                    {{ productDescription() }}
                  </p>
                }

                <!-- Rating -->
                <div class="flex items-center gap-1.5 mb-4">
                  @for (star of stars; track $index) {
                    <svg class="w-5 h-5"
                         [class]="$index < Math.round(product()!.rating)
                           ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'"
                         fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  }
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                    {{ product()!.rating | number:'1.1-1' }}
                  </span>
                  <span class="text-sm text-gray-400 dark:text-gray-500">
                    ({{ reviews().length }} {{ 'REVIEW.REVIEWS_COUNT' | translate }})
                  </span>
                </div>

                <!-- Stock -->
                <div class="flex items-center gap-2 mb-6">
                  @if (product()!.stock > 0) {
                    <span class="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                      {{ 'PRODUCT.IN_STOCK' | translate: { count: product()!.stock } }}
                    </span>
                  } @else {
                    <span class="text-sm text-red-500 dark:text-red-400">
                      {{ 'PRODUCT.OUT_OF_STOCK' | translate }}
                    </span>
                  }
                </div>

                <div class="mt-auto flex items-center justify-between">
                  <span class="text-3xl font-bold text-gray-900 dark:text-white">
                    {{ product()!.price | number:'1.0-0' }} ₽
                  </span>

                  @if (!auth.isAdmin()) {
                    <button (click)="onAddToCart()"
                            [disabled]="product()!.stock === 0 || addedToCart()"
                            class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium
                                   text-sm transition-all duration-200"
                            [class]="addedToCart()
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : product()!.stock === 0
                                ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 cursor-not-allowed'
                                : 'btn-primary'">
                      @if (addedToCart()) {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        {{ 'PRODUCT.ADDED' | translate }}
                      } @else {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3 3h2l.4 2M7 13h10l4-4H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                        {{ 'PRODUCT.ADD_TO_CART' | translate }}
                      }
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Reviews section -->
        @if (!loading()) {
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {{ 'REVIEW.TITLE' | translate }}
              @if (reviews().length > 0) {
                <span class="text-base font-normal text-gray-500 dark:text-gray-400 ml-2">
                  ({{ reviews().length }})
                </span>
              }
            </h2>

            <!-- Add review form (authenticated only) -->
            @if (auth.isAuthenticated() && !auth.isAdmin()) {
              <div class="border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {{ 'REVIEW.ADD_REVIEW' | translate }}
                </h3>

                <!-- Star selector -->
                <div class="flex items-center gap-1 mb-3">
                  <span class="text-sm text-gray-600 dark:text-gray-400 mr-2">
                    {{ 'REVIEW.YOUR_RATING' | translate }}:
                  </span>
                  @for (star of stars; track $index) {
                    <button type="button" (click)="newRating.set($index + 1)"
                            class="transition-transform hover:scale-110 focus:outline-none">
                      <svg class="w-7 h-7"
                           [class]="$index < newRating() ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'"
                           fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </button>
                  }
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-400 ml-1">
                    {{ newRating() }}/5
                  </span>
                </div>

                <!-- Comment -->
                <textarea [(ngModel)]="newComment"
                          [placeholder]="'REVIEW.COMMENT_PLACEHOLDER' | translate"
                          rows="3"
                          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600
                                 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500
                                 resize-none mb-3">
                </textarea>

                <!-- Submit -->
                <div class="flex items-center gap-3">
                  <button (click)="submitReview()"
                          [disabled]="submitting()"
                          class="btn-primary text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                    @if (submitting()) {
                      {{ 'REVIEW.SUBMITTING' | translate }}
                    } @else {
                      {{ 'REVIEW.SUBMIT' | translate }}
                    }
                  </button>
                  @if (submitSuccess()) {
                    <span class="text-sm text-green-600 dark:text-green-400">
                      ✓ {{ 'REVIEW.REVIEW_ADDED' | translate }}
                    </span>
                  }
                  @if (submitError()) {
                    <span class="text-sm text-red-500 dark:text-red-400">
                      {{ submitError() }}
                    </span>
                  }
                </div>
              </div>
            }

            @if (!auth.isAuthenticated()) {
              <div class="text-center py-4 mb-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ 'REVIEW.LOGIN_TO_REVIEW' | translate }}
                  <a routerLink="/auth/login" class="text-primary-600 hover:underline ml-1">
                    {{ 'NAV.LOGIN' | translate }}
                  </a>
                </p>
              </div>
            }

            <!-- Reviews loading skeleton -->
            @if (reviewsLoading()) {
              <div class="space-y-4">
                @for (i of [1, 2, 3]; track i) {
                  <div class="animate-pulse border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                    <div class="flex items-center gap-3 mb-2">
                      <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </div>
                    <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                    <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                  </div>
                }
              </div>
            }

            <!-- Reviews list -->
            @if (!reviewsLoading() && reviews().length === 0) {
              <div class="text-center py-8 text-gray-400 dark:text-gray-500">
                <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                <p>{{ 'REVIEW.NO_REVIEWS' | translate }}</p>
              </div>
            }

            @if (!reviewsLoading() && reviews().length > 0) {
              <div class="space-y-4">
                @for (review of reviews(); track review.id) {
                  <div class="border border-gray-100 dark:border-gray-700 rounded-xl p-4
                              hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex items-center gap-3">
                        <!-- Avatar -->
                        <div class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30
                                    flex items-center justify-center text-primary-600 dark:text-primary-400
                                    text-sm font-bold flex-shrink-0">
                          {{ review.username.charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <p class="text-sm font-semibold text-gray-900 dark:text-white">
                            {{ review.username }}
                          </p>
                          <p class="text-xs text-gray-400 dark:text-gray-500">
                            {{ review.createdAt | date:'dd.MM.yyyy HH:mm' }}
                          </p>
                        </div>
                      </div>

                      <!-- Admin delete -->
                      @if (auth.isAdmin()) {
                        <button (click)="deleteReview(review.id)"
                                class="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      }
                    </div>

                    <!-- Stars -->
                    <div class="flex items-center gap-0.5 mt-2 mb-2">
                      @for (star of stars; track $index) {
                        <svg class="w-4 h-4"
                             [class]="$index < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'"
                             fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      }
                    </div>

                    @if (review.comment) {
                      <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {{ review.comment }}
                      </p>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Product not found -->
        @if (!loading() && !product()) {
          <div class="text-center py-16">
            <p class="text-gray-500 dark:text-gray-400 text-lg mb-4">{{ 'PRODUCT.NOT_FOUND' | translate }}</p>
            <a routerLink="/catalog" class="btn-primary inline-block px-6 py-2.5 rounded-xl text-sm">
              {{ 'REVIEW.BACK_TO_CATALOG' | translate }}
            </a>
          </div>
        }

      </div>
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  private readonly route            = inject(ActivatedRoute);
  private readonly router           = inject(Router);
  private readonly productService   = inject(ProductService);
  private readonly reviewService    = inject(ReviewService);
  private readonly cartService      = inject(CartService);
  private readonly translateService = inject(TranslateService);
  readonly auth                     = inject(AuthService);

  private readonly currentLang = signal(this.translateService.currentLang ?? 'ru');

  readonly productDescription = computed(() => {
    this.currentLang(); // реагируем на смену языка
    const p = this.product();
    if (!p) return '';
    const key = `PRODUCTS.DESC_${p.id}`;
    const translated = this.translateService.instant(key);
    return translated !== key ? translated : (p.description ?? p.name ?? '');
  });

  readonly loading        = signal(true);
  readonly product        = signal<Product | null>(null);
  readonly reviews        = signal<Review[]>([]);
  readonly reviewsLoading = signal(true);
  readonly submitting     = signal(false);
  readonly submitSuccess  = signal(false);
  readonly submitError    = signal('');
  readonly addedToCart    = signal(false);
  readonly newRating      = signal(5);
  readonly Math           = Math;
  readonly stars          = [0, 1, 2, 3, 4];

  newComment = '';

  private productId = '';

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.productId) {
      this.router.navigate(['/catalog']);
      return;
    }
    this.translateService.onLangChange.subscribe(e => this.currentLang.set(e.lang));
    this.loadProduct();
    this.loadReviews();
  }

  private async loadProduct(): Promise<void> {
    try {
      const p = await firstValueFrom(this.productService.getProduct(this.productId));
      this.product.set(p ?? null);
    } catch {
      this.product.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadReviews(): Promise<void> {
    try {
      const list = await firstValueFrom(this.reviewService.getReviews(this.productId));
      this.reviews.set(list);
    } catch {
      this.reviews.set([]);
    } finally {
      this.reviewsLoading.set(false);
    }
  }

  onAddToCart(): void {
    const p = this.product();
    if (!p) return;
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: `/product/${this.productId}` } });
      return;
    }
    this.cartService.addToCart(p);
    this.addedToCart.set(true);
    setTimeout(() => this.addedToCart.set(false), 2000);
  }

  async submitReview(): Promise<void> {
    const rating = this.newRating();
    if (rating < 1 || rating > 5) return;
    const user = this.auth.user();
    if (!user) return;

    this.submitting.set(true);
    this.submitSuccess.set(false);
    this.submitError.set('');
    try {
      const request: ReviewRequest = {
        userId:   String(user.id ?? user.userId ?? ''),
        username: user.name ?? user.email ?? 'Пользователь',
        rating,
        comment:  this.newComment.trim() || undefined,
      };
      const saved = await firstValueFrom(this.reviewService.addReview(this.productId, request));
      this.reviews.update(list => [saved, ...list]);
      this.newComment = '';
      this.newRating.set(5);
      this.submitSuccess.set(true);
      setTimeout(() => this.submitSuccess.set(false), 3000);
      await this.loadProduct();
    } catch (err: any) {
      const msg = err?.error?.message ?? err?.message ?? 'Ошибка при отправке отзыва';
      this.submitError.set(msg);
      setTimeout(() => this.submitError.set(''), 5000);
    } finally {
      this.submitting.set(false);
    }
  }

  async deleteReview(reviewId: number): Promise<void> {
    try {
      await firstValueFrom(this.reviewService.deleteReview(this.productId, reviewId));
      this.reviews.update(list => list.filter(r => r.id !== reviewId));
      await this.loadProduct();
    } catch {
      // silently fail
    }
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = IMAGE_PLACEHOLDER;
  }
}
