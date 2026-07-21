package com.example.orderservice.dto;

import com.example.orderservice.model.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderStatusUpdateRequest {

    @NotNull(message = "Status cannot be null")
    private OrderStatus status;
}
