package com.example.notificationservice.service;

import com.example.notificationservice.dto.OrderEvent;
import com.example.notificationservice.model.Notification;
import com.example.notificationservice.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @KafkaListener(
            topics = "order-topic",
            groupId = "notification-group-v3",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumeOrderEvent(OrderEvent orderEvent) {
        log.info("Kafka-ից ստացվեց նոր պատվերի լուր՝ {}", orderEvent);

        String title = "Նոր Պատվեր #" + orderEvent.getOrderId();
        String message = String.format("Ձեր պատվերը հաջողությամբ ստեղծվել է։ Ընդհանուր գումարը՝ %s դրամ։",
                orderEvent.getTotalAmount());

        Notification notification = Notification.builder()
                .userId(orderEvent.getUserId())
                .title(title)
                .message(message)
                .totalPrice(orderEvent.getTotalAmount())
                .isRead(false)
                .build();

        notificationRepository.save(notification);
        log.info("Ծանուցումը հաջողությամբ պահպանվեց բազայում օգտատեր {} -ի համար", orderEvent.getUserId());
    }
}

