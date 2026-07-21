package com.example.orderservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class OrderRequest {

    @NotBlank(message = "Request ID cannot be blank")
    private String requestId;

    @NotNull(message = "User ID cannot be null")
    private Integer userId;

    @NotNull(message = "Product ID cannot be null")
    private Integer productId;

    @NotNull(message = "Quantity cannot be null")
    @Positive(message = "Quantity must be greater than zero")
    @Max(value = 1000, message = "Quantity cannot exceed 1000")
    private Integer quantity;

    private String userEmail;
    private String userName;
}