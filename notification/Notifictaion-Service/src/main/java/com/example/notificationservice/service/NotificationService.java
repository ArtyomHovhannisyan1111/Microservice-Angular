package com.example.notificationservice.service;

import com.example.notificationservice.dto.ConfirmOrderRequest;
import com.example.notificationservice.dto.OrderEvent;
import com.example.notificationservice.mapper.NotificationMapper;
import com.example.notificationservice.model.Notification;
import com.example.notificationservice.repository.NotificationRepository;
import com.example.notificationservice.util.NotificationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    @KafkaListener(
            topics = "order-topic",
            groupId = "notification-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumeOrderEvent(OrderEvent event) {

        String title = NotificationUtil.buildTitle(event.getOrderId());
        String message = NotificationUtil.buildMessage(event.getTotalAmount());

        var notification = NotificationMapper.toEntity(event, title, message);

        notificationRepository.save(notification);
    }

    public void confirmOrder(ConfirmOrderRequest request) {
        if (request.getUserEmail() != null && !request.getUserEmail().isBlank()) {
            emailService.sendOrderConfirmationEmail(
                request.getUserEmail(),
                request.getOrderId(),
                request.getTotalPrice() != null ? request.getTotalPrice() : BigDecimal.ZERO,
                request.getUserName() != null ? request.getUserName() : "Покупатель"
            );
        }

        Notification notification = Notification.builder()
            .userId(request.getUserId() != null ? request.getUserId() : 0L)
            .title("Заказ подтверждён")
            .message("Ваш заказ #" + request.getOrderId() +
                " на сумму " + request.getTotalPrice() + " ₽ подтверждён администратором.")
            .totalPrice(request.getTotalPrice() != null ? request.getTotalPrice() : BigDecimal.ZERO)
            .isRead(false)
            .build();

        notificationRepository.save(notification);
    }
}