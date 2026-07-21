package com.example.orderservice.dto;

import lombok.Data;

@Data
public class ConfirmOrderRequest {
    private String userEmail;
    private String userName;
}