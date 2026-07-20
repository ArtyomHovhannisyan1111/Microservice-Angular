package com.example.orderservice.client;

import com.example.orderservice.Dto.NotificationConfirmRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "notification-service", url = "${NOTIFICATION_SERVICE_URL:http://localhost:8098}")
public interface NotificationFeignClient {

    @PostMapping("/api/notifications/confirm-order")
    void confirmOrder(@RequestBody NotificationConfirmRequest request);

    @PostMapping("/api/notifications/cancel-order")
    void cancelOrder(@RequestBody NotificationConfirmRequest request);
}
