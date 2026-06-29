package com.example.orderservice.Dto;

import lombok.Data;

@Data
public class ConfirmOrderRequest {
    private String userEmail;
    private String userName;
}