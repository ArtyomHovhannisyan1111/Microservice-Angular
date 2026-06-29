package com.example.notificationservice.mapper;

import com.example.notificationservice.dto.OrderEvent;
import com.example.notificationservice.model.Notification;

import java.math.BigDecimal;

public class NotificationMapper {
    private NotificationMapper() {}

    public static Notification toEntity(OrderEvent orderEvent, String title, String message) {
        return Notification.builder()
                .userId(orderEvent.getUserId())
                .title(title)
                .message(message)
                .totalPrice(orderEvent.getTotalAmount() != null ? orderEvent.getTotalAmount() : BigDecimal.ZERO)
                .isRead(false)
                .build();
    }
}