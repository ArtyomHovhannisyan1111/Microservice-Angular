package com.example.paymentservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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

    @NotBlank(message = "Payment type is required")
    String type;

    @NotBlank(message = "Provider name is required")
    String providerName;

    @NotBlank(message = "Raw card or account number is required")
    String rawNumber;

    @NotBlank(message = "Cardholder name is required")
    String cardholderName;
}
