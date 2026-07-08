package com.example.analyticsservice.service;

import com.example.analyticsservice.dto.external.OrderDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalDataService {

    private final RestTemplate restTemplate;

    @Value("${services.order:http://localhost:8082}")
    private String orderServiceUrl;

    @Value("${services.product:http://localhost:8081}")
    private String productServiceUrl;

    public List<OrderDto> getAllOrders() {
        try {
            OrderDto[] orders = restTemplate.getForObject(orderServiceUrl + "/api/orders", OrderDto[].class);
            return orders != null ? Arrays.asList(orders) : List.of();
        } catch (Exception e) {
            log.error("Failed to fetch orders: {}", e.getMessage());
            return List.of();
        }
    }

    public long getTotalProducts() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> page = restTemplate.getForObject(
                    productServiceUrl + "/api/products/page?size=1&page=0", Map.class);
            if (page != null && page.containsKey("totalElements")) {
                return ((Number) page.get("totalElements")).longValue();
            }
        } catch (Exception e) {
            log.error("Failed to fetch product count: {}", e.getMessage());
        }
        return 0;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getAllProducts() {
        try {
            Map<String, Object> page = restTemplate.getForObject(
                    productServiceUrl + "/api/products/page?size=500&page=0", Map.class);
            if (page != null && page.containsKey("content")) {
                return (List<Map<String, Object>>) page.get("content");
            }
        } catch (Exception e) {
            log.error("Failed to fetch products: {}", e.getMessage());
        }
        return List.of();
    }
}
