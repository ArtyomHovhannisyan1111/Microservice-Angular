export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Полный URL или относительный путь (/images/item.jpg) — трансформируется ImageUrlPipe */
  imageUrl?: string;
  /** Устаревшее поле для совместимости с mock-данными */
  image?: string;
  category: string;
  rating: number;
  stock: number;
}
