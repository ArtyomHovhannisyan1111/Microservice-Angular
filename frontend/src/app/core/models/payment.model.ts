export interface TopUpResponse {
  cardId: number;
  maskedPan: string;
  brand: string;
  amount: number;
  message: string;
}

export interface PaymentMethod {
  id: number;
  userId: number;
  type: string;
  providerName: string;
  maskedNumber: string;
  cardholderName: string;
  active: boolean;
  amount: number;
}

export interface PaymentMethodRequest {
  userId: number;
  type: string;
  providerName: string;
  rawNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
}
