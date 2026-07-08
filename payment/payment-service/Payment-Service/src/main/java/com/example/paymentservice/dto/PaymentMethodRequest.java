package com.example.paymentservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.jackson.Jacksonized;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Jacksonized
public class PaymentMethodRequest {
    @NotNull(message = "User Id cannot be Null")
    Long userId;

    @NotNull(message = "Payemnt type is required")
    String type;

    @NotNull(message = "Provider name is required")
    String providerName;

    @NotNull(message = "Raw card or account number is required")
    String rawNumber;

    @NotNull(message = "Cardholder name is required")
    String cardholderName;

    @NotNull(message = "CVV is required")
    String cvv;
}