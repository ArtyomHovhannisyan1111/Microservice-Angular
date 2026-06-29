package com.example.orderservice.mapper;

import com.example.orderservice.Dto.OrderEvent;
import com.example.orderservice.Dto.OrderRequest;
import com.example.orderservice.model.Order;
import com.example.orderservice.model.OrderStatus;

public class OrderMapper {

    private OrderMapper() {}

    public static Order toEntity(OrderRequest request) {
        return Order.builder()
                .userId(request.getUserId())
                .productId(request.getProductId())
                .quantity(request.getQuantity())
                .status(OrderStatus.PENDING)
                .build();
    }

    public static OrderEvent toEvent(Order order) {
        return OrderEvent.builder()
                .orderId(order.getId())
                .userId(order.getUserId())
                .totalAmount(order.getTotalPrice())
                .status(order.getStatus())
                .build();
    }
}