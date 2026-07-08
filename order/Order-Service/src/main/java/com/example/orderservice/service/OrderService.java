package com.example.orderservice.service;

import com.example.orderservice.Dto.NotificationConfirmRequest;
import com.example.orderservice.Dto.OrderRequest;
import com.example.orderservice.Dto.ProductResponse;
import com.example.orderservice.Dto.StockUpdateRequest;
import com.example.orderservice.Repository.OrderRepository;
import com.example.orderservice.client.NotificationFeignClient;
import com.example.orderservice.client.ProductFeignClient;
import com.example.orderservice.client.UserServiceClient;
import com.example.orderservice.exception.ResourceNotFoundException;
import com.example.orderservice.mapper.OrderMapper;
import com.example.orderservice.model.Order;
import com.example.orderservice.model.OrderStatus;
import com.example.orderservice.util.OrderValidationUtil;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductFeignClient productFeignClient;
    private final NotificationFeignClient notificationFeignClient;
    private final UserServiceClient userServiceClient;
    private final RequestLogService requestLogService;

    // noRollbackFor: when balance is insufficient we commit the CANCELLED order record before propagating the exception
    @Transactional(rollbackFor = Exception.class, noRollbackFor = IllegalArgumentException.class)
    public Order createOrder(OrderRequest request) {
        if (requestLogService.isDuplicate(request.getRequestId())) {
            log.warn("Duplicate request detected: {}", request.getRequestId());
            throw new IllegalStateException("Duplicate request: " + request.getRequestId());
        }

        ProductResponse product = productFeignClient.getProduct(request.getProductId());
        OrderValidationUtil.validateProduct(product);
        OrderValidationUtil.validateStock(product, request.getQuantity());

        BigDecimal total = product.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
        productFeignClient.decreaseStock(request.getProductId(), new StockUpdateRequest(request.getQuantity()));

        try {
            userServiceClient.deductBalance(request.getUserId(), Map.of("amount", total));
        } catch (FeignException e) {
            productFeignClient.increaseStock(request.getProductId(), new StockUpdateRequest(request.getQuantity()));

            if (e.status() == 400) {
                // Insufficient funds: save CANCELLED order for history, send cancel email
                Order cancelled = OrderMapper.toEntity(request);
                cancelled.setStatus(OrderStatus.CANCELLED);
                cancelled.setTotalPrice(total);
                Order savedCancelled = orderRepository.save(cancelled);
                log.warn("Order {} cancelled — insufficient balance for userId={}", savedCancelled.getId(), request.getUserId());

                sendCancellationNotification(savedCancelled, request);

                throw new IllegalArgumentException("Недостаточно средств на балансе");
            }

            log.error("User service call failed: status={}, msg={}", e.status(), e.getMessage());
            throw new IllegalStateException("Сервис оплаты недоступен. Попробуйте позже.");
        }

        try {
            Order order = OrderMapper.toEntity(request);
            order.setStatus(OrderStatus.PENDING);
            order.setTotalPrice(total);
            Order saved = orderRepository.save(order);
            requestLogService.logRequest(request.getRequestId());
            log.info("Order created: id={}, userId={}, productId={}, total={}",
                    saved.getId(), saved.getUserId(), saved.getProductId(), saved.getTotalPrice());
            return saved;
        } catch (Exception e) {
            log.error("Order save failed after balance deduction, restoring stock: {}", e.getMessage());
            productFeignClient.increaseStock(request.getProductId(), new StockUpdateRequest(request.getQuantity()));
            throw e;
        }
    }

    private void sendCancellationNotification(Order order, OrderRequest request) {
        try {
            notificationFeignClient.cancelOrder(
                    NotificationConfirmRequest.builder()
                            .orderId(order.getId().longValue())
                            .userId(request.getUserId() != null ? request.getUserId().longValue() : 0L)
                            .userEmail(request.getUserEmail())
                            .userName(request.getUserName() != null ? request.getUserName() : "Покупатель")
                            .totalPrice(order.getTotalPrice())
                            .build()
            );
        } catch (Exception e) {
            log.warn("Failed to send cancellation notification for order {}: {}", order.getId(), e.getMessage());
        }
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