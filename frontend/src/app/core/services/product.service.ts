import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Product } from '../models/product.model';
import { API_BASE_URL } from '../tokens/api.token';

const MOCK_PRODUCTS: Product[] = [
  { id: '52', name: 'TestImage-112916', description: 'Тестовый товар для проверки загрузки изображений', price: 999, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', category: 'Аксессуары', rating: 0, stock: 5 },
  { id: '76', name: 'Xiaomi Pad 6 Pro', description: 'Android-планшет с дисплеем 11 дюймов 144 Гц, процессором Snapdragon 8 Gen 1 и поддержкой стилуса Smart Pen', price: 49990, imageUrl: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&q=80', category: 'Электроника', rating: 0, stock: 12 },
  { id: '77', name: 'Lenovo IdeaPad Gaming 3', description: 'Игровой ноутбук с процессором AMD Ryzen 5 7535HS, видеокартой RTX 4060, дисплеем 16 дюймов IPS 144 Гц', price: 89990, imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80', category: 'Электроника', rating: 5, stock: 7 },
  { id: '78', name: 'DJI Mini 4 Pro', description: 'Складной квадрокоптер с камерой 4K/60fps, временем полёта до 34 минут и интеллектуальным избеганием препятствий', price: 89990, imageUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=80', category: 'Электроника', rating: 0, stock: 5 },
  { id: '79', name: 'Kindle Paperwhite 2024', description: 'Электронная книга с антибликовым экраном 6,8 дюймов, влагозащитой IPX8 и подсветкой регулируемой цветовой температуры', price: 12990, imageUrl: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600&q=80', category: 'Электроника', rating: 0, stock: 20 },
  { id: '80', name: 'Corsair K95 RGB Platinum', description: 'Механическая игровая клавиатура с переключателями Cherry MX Speed Silver, RGB-подсветкой и медиа-клавишами', price: 15990, imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80', category: 'Периферия', rating: 0, stock: 9 },
  { id: '81', name: 'Logitech G Pro Wireless', description: 'Беспроводная игровая мышь с сенсором Hero 25K, временем работы до 60 часов и весом 61 г', price: 9990, imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80', category: 'Периферия', rating: 0, stock: 14 },
  { id: '82', name: 'HyperX Cloud Alpha S', description: 'Игровая гарнитура с виртуальным 7.1-звуком, двойными камерами и регулятором громкости на проводе', price: 8990, imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80', category: 'Периферия', rating: 0, stock: 11 },
  { id: '83', name: 'Blue Yeti USB Microphone', description: 'Студийный USB-микрофон с четырьмя режимами записи: кардиоидный, стерео, всенаправленный, двунаправленный', price: 11990, imageUrl: 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=600&q=80', category: 'Периферия', rating: 0, stock: 8 },
  { id: '84', name: 'ASUS ProArt PA279CV 27 4K', description: 'Профессиональный 4K-монитор с охватом 100% sRGB, USB-C 90 Вт и сертификацией VESA DisplayHDR 400', price: 64990, imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80', category: 'Мониторы', rating: 0, stock: 4 },
  { id: '85', name: 'Gigabyte M27Q 27 QHD 165Hz', description: 'Игровой монитор IPS QHD 2560x1440, частотой обновления 165 Гц и временем отклика 0,5 мс', price: 39990, imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c228b0e86a?w=600&q=80', category: 'Мониторы', rating: 0, stock: 6 },
  { id: '86', name: 'MSI MAG274QRF-QD 27 QHD', description: 'Монитор с квантовыми точками Rapid IPS, охватом 97% DCI-P3 и AMD FreeSync Premium Pro', price: 44990, imageUrl: 'https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=600&q=80', category: 'Мониторы', rating: 0, stock: 5 },
  { id: '87', name: 'AOC C27G2ZU 27 FHD 240Hz', description: 'Изогнутый монитор VA FHD 240 Гц, временем отклика 0,5 мс и технологией AOC Shadow Control', price: 34990, imageUrl: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&q=80', category: 'Мониторы', rating: 0, stock: 7 },
  { id: '88', name: 'Sennheiser Momentum 4', description: 'Беспроводные наушники с активным шумоподавлением, автономностью до 60 часов и кодеком aptX Adaptive', price: 32990, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', category: 'Аудио', rating: 0, stock: 6 },
  { id: '89', name: 'Audio-Technica ATH-M50x', description: 'Профессиональные студийные наушники с закрытой конструкцией, сменными кабелями и расширенным диапазоном частот', price: 14990, imageUrl: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=600&q=80', category: 'Аудио', rating: 0, stock: 13 },
  { id: '90', name: 'Creative Pebble V3', description: 'Компактные настольные колонки с USB-C аудио, Bluetooth 5.0 и мощностью 8 Вт без отдельного источника питания', price: 7990, imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80', category: 'Аудио', rating: 0, stock: 18 },
  { id: '91', name: 'Edifier R1700BT', description: 'Полочные активные колонки с Bluetooth 5.0, встроенным 24-битным ЦАП и деревянными боковыми панелями', price: 14990, imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80', category: 'Аудио', rating: 0, stock: 10 },
  { id: '92', name: 'Logitech MX Keys Mini', description: 'Компактная беспроводная клавиатура с умной подсветкой, подключением до 3 устройств и автономностью до 10 месяцев', price: 9990, imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80', category: 'Аксессуары', rating: 0, stock: 22 },
  { id: '93', name: 'Belkin 3-in-1 MagSafe', description: 'Зарядное устройство 3-в-1 MagSafe для одновременной зарядки iPhone, Apple Watch и AirPods', price: 7990, imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=80', category: 'Аксессуары', rating: 0, stock: 15 },
  { id: '94', name: 'Elgato Stream Deck MK.2', description: 'Программируемый стрим-контроллер с 15 LCD-кнопками, интеграцией со стриминговыми сервисами и магнитным держателем', price: 15990, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', category: 'Аксессуары', rating: 0, stock: 7 },
  { id: '95', name: 'Baseus GaN Charger 100W', description: 'Компактное GaN-зарядное устройство 100 Вт с тремя портами USB-C и одним USB-A для зарядки нескольких устройств', price: 3990, imageUrl: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&q=80', category: 'Аксессуары', rating: 0, stock: 35 },
];

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private localProducts: Product[] = [];

  getProducts(category?: string): Observable<Product[]> {
    const params: Record<string, string> = category ? { category } : {};
    return this.http.get<any[]>(`${this.baseUrl}/api/products`, { params }).pipe(
      map(items => items.map(p => this.normalize(p))),
      catchError(() => {
        const all = [...MOCK_PRODUCTS, ...this.localProducts];
        return of(category ? all.filter(p => p.category === category) : all);
      })
    );
  }

  getProduct(id: string): Observable<Product | undefined> {
    return this.http.get<any>(`${this.baseUrl}/api/products/${id}`).pipe(
      map(p => this.normalize(p)),
      catchError(() => of([...MOCK_PRODUCTS, ...this.localProducts].find(p => p.id === id)))
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
    return this.http.post<Product>(`${this.baseUrl}/api/products`, body).pipe(
      catchError(() => {
        const product: Product = { ...data, id: `local-${Date.now()}` };
        this.localProducts.push(product);
        return of(product);
      })
    );
  }

  deleteProduct(id: string): Observable<void> {
    if (id.startsWith('local-')) {
      this.localProducts = this.localProducts.filter(p => p.id !== id);
      return of(undefined);
    }
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
        items: MOCK_PRODUCTS,
        totalPages: 1,
        totalElements: MOCK_PRODUCTS.length
      }))
    );
  }

  getCategories(): string[] {
    const all = [...MOCK_PRODUCTS, ...this.localProducts];
    return [...new Set(all.map(p => p.category))];
  }
}