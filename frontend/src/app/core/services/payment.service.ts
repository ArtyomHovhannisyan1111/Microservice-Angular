import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TopUpResponse, PaymentMethod, PaymentMethodRequest } from '../models/payment.model';
import { API_BASE_URL } from '../tokens/api.token';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getByUser(userId: number): Promise<PaymentMethod[]> {
    return firstValueFrom(
      this.http.get<PaymentMethod[]>(`${this.baseUrl}/api/payment-methods/user/${userId}`)
    );
  }

  add(req: PaymentMethodRequest): Promise<PaymentMethod> {
    return firstValueFrom(
      this.http.post<PaymentMethod>(`${this.baseUrl}/api/payment-methods`, req)
    );
  }

  deposit(paymentMethodId: number, amount: number): Promise<TopUpResponse> {
    return firstValueFrom(
      this.http.post<TopUpResponse>(`${this.baseUrl}/api/v1/balance/deposit`, { paymentMethodId, amount })
    );
  }

  transfer(paymentMethodId: number, amount: number, walletUserId?: number): Promise<TopUpResponse> {
    return firstValueFrom(
      this.http.post<TopUpResponse>(`${this.baseUrl}/api/v1/balance/transfer`, { paymentMethodId, amount, walletUserId })
    );
  }
}
