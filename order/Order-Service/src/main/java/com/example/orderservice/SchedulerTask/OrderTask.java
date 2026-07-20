package com.example.orderservice.SchedulerTask;

import com.example.orderservice.Dto.NotificationConfirmRequest;
import com.example.orderservice.Repository.OrderRepository;
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
                // 1. Сначала меняем статус и сохраняем в БД.
                //    Если save упадёт — письмо не отправится, заказ останется PENDING
                //    и будет повторно обработан на следующем запуске (без дублей email).
                order.setStatus(OrderStatus.CONFIRMED);
                orderRepository.save(order);

                // 2. Только после успешного сохранения отправляем уведомление.
                //    Если email упадёт — заказ уже CONFIRMED и больше не попадёт
                //    в findByStatus(PENDING), дублей не будет.
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