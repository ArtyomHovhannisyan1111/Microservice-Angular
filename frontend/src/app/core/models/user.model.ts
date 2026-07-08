export interface User {
  id: string;
  userId?: number;
  walletUserId?: number;
  email: string;
  name: string;
  token?: string;
  role?: string;
  balance?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}
