package com.example.notificationservice.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ConfirmOrderRequest {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private BigDecimal totalPrice;
    private String userName;
}