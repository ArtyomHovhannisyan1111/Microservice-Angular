package com.example.analyticsservice.consumer;

import com.example.analyticsservice.dto.OrderPlacedEvent;
import com.example.analyticsservice.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final AnalyticsService analyticsService;

    @KafkaListener(
        topics   = "order-placed-topic",
        groupId  = "analytics-group"
    )
    public void onOrderPlaced(OrderPlacedEvent event) {
        log.info("Received order event: orderId={}", event.getOrderId());
        try {
            analyticsService.processOrderPlaced(event);
        } catch (Exception e) {
            log.error("Failed to process order event orderId={}: {}", event.getOrderId(), e.getMessage(), e);
        }
    }
}
