export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'confirmed' | 'approved' | 'rejected';

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

/** Ответ бекенда */
export interface Order {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  userEmail?: string;
  userName?: string;
}

export interface CreateOrderRequest {
  requestId: string;
  userId?: number;
  productId: number;
  quantity: number;
  userEmail?: string;
  userName?: string;
}
