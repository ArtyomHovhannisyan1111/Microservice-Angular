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

    @KafkaListener(topics = "order-topic", groupId = "notification-group", containerFactory = "kafkaListenerContainerFactory")
    public void consumeOrderEvent(OrderEvent event) {
        notificationRepository.save(NotificationMapper.toEntity(event,
                NotificationUtil.buildTitle(event.getOrderId()),
                NotificationUtil.buildMessage(event.getTotalAmount())));
    }

    @KafkaListener(topics = "order-cancel-topic", groupId = "notification-group", containerFactory = "notificationListenerContainerFactory")
    public void consumeCancelOrder(ConfirmOrderRequest req) {
        cancelOrder(req);
    }

    @KafkaListener(topics = "order-confirm-topic", groupId = "notification-group", containerFactory = "notificationListenerContainerFactory")
    public void consumeConfirmOrder(ConfirmOrderRequest req) {
        confirmOrder(req);
    }

    public void cancelOrder(ConfirmOrderRequest req) {
        if (req.getUserEmail() != null && !req.getUserEmail().isBlank())
            emailService.sendOrderCancellationEmail(req.getUserEmail(), req.getOrderId(),
                    req.getTotalPrice() != null ? req.getTotalPrice() : BigDecimal.ZERO,
                    req.getUserName() != null ? req.getUserName() : "Покупатель");

        notificationRepository.save(Notification.builder()
                .userId(req.getUserId() != null ? req.getUserId() : 0L)
                .title("Заказ отменён")
                .message("Ваш заказ #" + req.getOrderId() + " на сумму " + req.getTotalPrice() + " ₽ отменён: недостаточно средств на балансе.")
                .totalPrice(req.getTotalPrice() != null ? req.getTotalPrice() : BigDecimal.ZERO)
                .isRead(false)
                .build());
    }

    public void confirmOrder(ConfirmOrderRequest req) {
        if (req.getUserEmail() != null && !req.getUserEmail().isBlank())
            emailService.sendOrderConfirmationEmail(req.getUserEmail(), req.getOrderId(),
                    req.getTotalPrice() != null ? req.getTotalPrice() : BigDecimal.ZERO,
                    req.getUserName() != null ? req.getUserName() : "Покупатель");

        notificationRepository.save(Notification.builder()
                .userId(req.getUserId() != null ? req.getUserId() : 0L)
                .title("Заказ подтверждён")
                .message("Ваш заказ #" + req.getOrderId() + " на сумму " + req.getTotalPrice() + " ₽ подтверждён администратором.")
                .totalPrice(req.getTotalPrice() != null ? req.getTotalPrice() : BigDecimal.ZERO)
                .isRead(false)
                .build());
    }
}
