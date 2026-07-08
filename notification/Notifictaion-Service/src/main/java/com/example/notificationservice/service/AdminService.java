package com.example.notificationservice.service;

import com.example.notificationservice.dto.OrderResponse;
import com.example.notificationservice.model.Notification;
import com.example.notificationservice.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final NotificationRepository notificationRepository;
    private final RestClient restClient;

    @Value("${ORDER_SERVICE_URL:http://localhost:8084}")
    private String orderServiceUrl;

    public List<OrderResponse> getAllOrders() {
        return restClient.get()
                .uri(orderServiceUrl + "/api/orders")
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
    }

    public List<Notification> getNotifications() {
        return notificationRepository.findTop20ByOrderByCreatedAtDesc();
    }
}