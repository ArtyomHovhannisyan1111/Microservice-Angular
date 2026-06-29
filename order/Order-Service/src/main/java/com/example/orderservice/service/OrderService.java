package com.example.orderservice.service;

import com.example.orderservice.Dto.NotificationConfirmRequest;
import com.example.orderservice.Dto.OrderRequest;
import com.example.orderservice.Dto.ProductResponse;
import com.example.orderservice.Dto.StockUpdateRequest;
import com.example.orderservice.Repository.OrderRepository;
import com.example.orderservice.client.NotificationFeignClient;
import com.example.orderservice.client.ProductFeignClient;
import com.example.orderservice.exception.ResourceNotFoundException;
import com.example.orderservice.mapper.OrderMapper;
import com.example.orderservice.model.Order;
import com.example.orderservice.model.OrderStatus;
import com.example.orderservice.util.OrderValidationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductFeignClient productFeignClient;
    private final NotificationFeignClient notificationFeignClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public Order createOrder(OrderRequest request) {
        ProductResponse product = productFeignClient.getProduct(request.getProductId());
        OrderValidationUtil.validateProduct(product);

        Order order = OrderMapper.toEntity(request);
        order.setStatus(OrderStatus.APPROVED);
        order.setTotalPrice(product.getPrice().multiply(BigDecimal.valueOf(request.getQuantity())));

        order = orderRepository.save(order);

        productFeignClient.decreaseStock(order.getProductId(), new StockUpdateRequest(order.getQuantity()));

        kafkaTemplate.send("order-topic", OrderMapper.toEvent(order));
        return order;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order getOrderById(Integer id) {
        return findOrder(id);
    }

    @Transactional
    public Order updateStatus(Integer id, OrderStatus status) {
        Order order = findOrder(id);
        OrderValidationUtil.validateStatus(status, order);
        order.setStatus(status);
        return orderRepository.save(order);
    }

    @Transactional
    public Order cancelOrder(Integer id) {
        return updateStatus(id, OrderStatus.CANCELLED);
    }

    @Transactional
    public Order confirmOrder(Integer id, String userEmail, String userName) {
        Order order = findOrder(id);

        if (order.getStatus() == OrderStatus.APPROVED) {
            order.setStatus(OrderStatus.CONFIRMED);
            order = orderRepository.save(order);
        }

        try {
            NotificationConfirmRequest req = NotificationConfirmRequest.builder()
                .orderId(Long.valueOf(id))
                .userId(order.getUserId() != null ? Long.valueOf(order.getUserId()) : 0L)
                .userEmail(userEmail)
                .totalPrice(order.getTotalPrice() != null ? order.getTotalPrice() : BigDecimal.ZERO)
                .userName(userName != null ? userName : "Покупатель")
                .build();
            notificationFeignClient.confirmOrder(req);
        } catch (Exception e) {
            log.warn("Failed to send confirmation notification for order {}: {}", id, e.getMessage());
        }

        return order;
    }

    private Order findOrder(Integer id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }
}