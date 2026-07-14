package com.example.orderservice.service;

import com.example.orderservice.Dto.*;
import com.example.orderservice.Repository.OrderRepository;
import com.example.orderservice.client.*;
import com.example.orderservice.exception.ResourceNotFoundException;
import com.example.orderservice.mapper.OrderMapper;
import com.example.orderservice.model.*;
import com.example.orderservice.util.OrderValidationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private static final String ORDER_TOPIC = "order-topic";
    private static final String ORDER_PLACED_TOPIC = "order-placed-topic";

    private final OrderRepository orderRepository;
    private final ProductFeignClient productFeignClient;
    private final UserServiceClient userServiceClient;
    private final NotificationFeignClient notificationFeignClient;
    private final RequestLogService requestLogService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional(rollbackFor = Exception.class)
    public Order createOrder(OrderRequest request) {
        OrderValidationUtil.checkDuplicate(request.getRequestId(), requestLogService);

        ProductResponse product = productFeignClient.getProduct(request.getProductId());
        OrderValidationUtil.validateProduct(product);
        OrderValidationUtil.validateStock(product, request.getQuantity());

        productFeignClient.decreaseStock(request.getProductId(), new StockUpdateRequest(request.getQuantity()));

        BigDecimal total = product.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
        userServiceClient.deductBalance(request.getUserId(), Map.of("amount", total));

        Order entity = OrderMapper.toEntity(request);
        entity.setStatus(OrderStatus.PENDING);
        entity.setTotalPrice(total);
        Order order = orderRepository.save(entity);

        requestLogService.logRequest(request.getRequestId());
        publishOrderEvents(order, product);
        return order;
    }

    @Transactional
    public Order cancelOrder(Integer id) {
        Order order = findOrder(id);
        OrderValidationUtil.validateCancelable(order);

        userServiceClient.topUpBalance(order.getUserId(), Map.of("amount", order.getTotalPrice()));
        productFeignClient.increaseStock(order.getProductId(), new StockUpdateRequest(order.getQuantity()));

        order.setStatus(OrderStatus.CANCELLED);
        return orderRepository.save(order);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public List<Order> getOrdersByUserId(Integer userId) {
        return orderRepository.findByUserId(userId);
    }

    public Order getOrderById(Integer id) {
        return findOrder(id);
    }

    @Transactional
    public Order updateStatus(Integer id, OrderStatus status) {
        Order order = findOrder(id);
        order.setStatus(status);
        return orderRepository.save(order);
    }

    @Transactional
    public Order confirmOrder(Integer id, String userEmail, String userName) {
        Order order = findOrder(id);
        notificationFeignClient.confirmOrder(NotificationConfirmRequest.builder()
                .orderId(order.getId().longValue())
                .userId(order.getUserId() != null ? order.getUserId().longValue() : 0L)
                .userEmail(userEmail)
                .totalPrice(order.getTotalPrice())
                .userName(userName)
                .build());
        return order;
    }

    public void deleteOrder(Integer id) {
        findOrder(id);
        orderRepository.deleteById(id);
    }

    private Order findOrder(Integer id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    private void publishOrderEvents(Order order, ProductResponse product) {
        kafkaTemplate.send(ORDER_TOPIC, new OrderCreatedEvent(
                order.getId().longValue(),
                order.getUserId() != null ? order.getUserId().longValue() : 0L,
                order.getTotalPrice(),
                order.getStatus().name()
        ));

        OrderPlacedEvent.OrderItemEvent item = new OrderPlacedEvent.OrderItemEvent(
                product.getProductId() != null ? product.getProductId().longValue() : 0L,
                product.getName(),
                order.getQuantity(),
                product.getPrice() != null ? product.getPrice().doubleValue() : 0.0
        );

        kafkaTemplate.send(ORDER_PLACED_TOPIC, new OrderPlacedEvent(
                order.getId().longValue(),
                List.of(item)
        ));
    }
}