package com.example.orderservice.service;

import com.example.orderservice.client.NotificationFeignClient;
import com.example.orderservice.client.ProductFeignClient;
import com.example.orderservice.client.UserServiceClient;
import com.example.orderservice.dto.NotificationConfirmRequest;
import com.example.orderservice.dto.OrderCreatedEvent;
import com.example.orderservice.dto.OrderPlacedEvent;
import com.example.orderservice.dto.OrderRequest;
import com.example.orderservice.dto.ProductResponse;
import com.example.orderservice.dto.StockUpdateRequest;
import com.example.orderservice.exception.ResourceNotFoundException;
import com.example.orderservice.mapper.OrderMapper;
import com.example.orderservice.model.Order;
import com.example.orderservice.model.OrderStatus;
import com.example.orderservice.repository.OrderRepository;
import com.example.orderservice.util.OrderValidationUtil;
import feign.FeignException;
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

    private static final String ORDER_CANCEL_TOPIC = "order-cancel-topic";
    private static final String ORDER_CONFIRM_TOPIC = "order-confirm-topic";

    private final OrderRepository orderRepository;
    private final ProductFeignClient productFeignClient;
    private final UserServiceClient userServiceClient;
    private final NotificationFeignClient notificationFeignClient;
    private final RequestLogService requestLogService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional(rollbackFor = Exception.class)
    public Order createOrder(OrderRequest request) {
        requestLogService.ensureUnique(request.getRequestId());

        ProductResponse product = productFeignClient.getProduct(request.getProductId());
        OrderValidationUtil.validateProduct(product);
        OrderValidationUtil.validateStock(product, request.getQuantity());

        productFeignClient.decreaseStock(request.getProductId(), new StockUpdateRequest(request.getQuantity()));

        BigDecimal total = product.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
        try {
            userServiceClient.deductBalance(request.getUserId(), Map.of("amount", total));
        } catch (FeignException.BadRequest e) {
            productFeignClient.increaseStock(request.getProductId(), new StockUpdateRequest(request.getQuantity()));
            if (request.getUserEmail() != null) {
                kafkaTemplate.send(ORDER_CANCEL_TOPIC, NotificationConfirmRequest.builder()
                        .orderId(0L)
                        .userId(request.getUserId() != null ? request.getUserId().longValue() : 0L)
                        .userEmail(request.getUserEmail())
                        .totalPrice(total)
                        .userName(request.getUserName())
                        .build());
            }
            throw new IllegalStateException("Недостаточно средств на балансе");
        }

        Order entity = OrderMapper.toEntity(request);
        entity.setStatus(OrderStatus.PENDING);
        entity.setTotalPrice(total);
        Order order = orderRepository.save(entity);

        publishOrderEvents(order, product);
        return order;
    }

    public Order cancelOrder(Integer id) {
        Order order = findOrder(id);
        OrderValidationUtil.validateCancelable(order);


        order.setStatus(OrderStatus.CANCELLED);
        Order saved = orderRepository.save(order);
        try {
            userServiceClient.topUpBalance(saved.getUserId(), Map.of("amount", saved.getTotalPrice()));
        } catch (Exception e) {
            log.error("Failed to refund balance for order {}: {}", saved.getId(), e.getMessage(), e);
        }
        try {
            productFeignClient.increaseStock(saved.getProductId(), new StockUpdateRequest(saved.getQuantity()));
        } catch (Exception e) {
            log.error("Failed to return stock for order {}: {}", saved.getId(), e.getMessage(), e);
        }

        try {
            notificationFeignClient.cancelOrder(
                    NotificationConfirmRequest.builder()
                            .orderId(saved.getId().longValue())
                            .userId(saved.getUserId() != null ? saved.getUserId().longValue() : 0L)
                            .userEmail(saved.getUserEmail() != null ? saved.getUserEmail() : "")
                            .userName(saved.getUserName() != null ? saved.getUserName() : "Покупатель")
                            .totalPrice(saved.getTotalPrice() != null ? saved.getTotalPrice() : BigDecimal.ZERO)
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to send cancellation notification for order {}: {}", saved.getId(), e.getMessage(), e);
        }

        return saved;
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
        kafkaTemplate.send(ORDER_CONFIRM_TOPIC, NotificationConfirmRequest.builder()
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