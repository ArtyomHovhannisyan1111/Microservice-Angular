package com.example.orderservice.scheduler;

import com.example.orderservice.dto.NotificationConfirmRequest;
import com.example.orderservice.repository.OrderRepository;
import com.example.orderservice.client.NotificationFeignClient;
import com.example.orderservice.model.Order;
import com.example.orderservice.model.OrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderTask {

    private final OrderRepository orderRepository;
    private final NotificationFeignClient notificationFeignClient;

    @Scheduled(fixedRate = 300000)
    public void checkPendingOrders() {
        List<Order> pendingOrders = orderRepository.findByStatus(OrderStatus.PENDING);

        if (pendingOrders.isEmpty()) {
            return;
        }

        log.info("Scheduler: found {} pending order(s) to confirm", pendingOrders.size());

        for (Order order : pendingOrders) {
            try {
                order.setStatus(OrderStatus.CONFIRMED);
                orderRepository.save(order);
                notificationFeignClient.confirmOrder(
                        NotificationConfirmRequest.builder()
                                .orderId(order.getId().longValue())
                                .userId(order.getUserId() != null ? order.getUserId().longValue() : 0L)
                                .userEmail(order.getUserEmail() != null ? order.getUserEmail() : "")
                                .userName(order.getUserName() != null ? order.getUserName() : "Покупатель")
                                .totalPrice(order.getTotalPrice() != null ? order.getTotalPrice() : BigDecimal.ZERO)
                                .build()
                );

                log.info("Scheduler: order {} confirmed and notification sent", order.getId());

            } catch (Exception e) {
                log.error("Scheduler: failed to process order {}: {}", order.getId(), e.getMessage(), e);
            }
        }
    }
}