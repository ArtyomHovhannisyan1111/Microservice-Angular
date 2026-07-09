export interface Review {
  id: number;
  productId: number;
  userId: string;
  username: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ReviewRequest {
  userId: string;
  username: string;
  rating: number;
  comment?: string;
}
