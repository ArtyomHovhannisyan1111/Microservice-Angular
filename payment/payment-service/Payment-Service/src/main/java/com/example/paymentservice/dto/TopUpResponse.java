package com.example.paymentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopUpResponse {

    private Long cardId;
    private String maskedPan;
    private String brand;
    private BigDecimal amount;
    private String message;
}
