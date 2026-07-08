package com.example.paymentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentMethodResponse {
    private Long id;
    private Long userId;
    private String type;
    private String providerName;
    private String maskedNumber;
    private String cardholderName;
    private boolean isActive;

}
