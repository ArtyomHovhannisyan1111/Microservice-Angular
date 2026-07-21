package com.example.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationConfirmRequest {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private BigDecimal totalPrice;
    private String userName;
}