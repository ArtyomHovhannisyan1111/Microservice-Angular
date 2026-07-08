package com.example.orderservice.service;

import com.example.orderservice.Dto.OrderRequest;
import com.example.orderservice.Dto.ProductResponse;
import com.example.orderservice.Repository.OrderRepository;
import com.example.orderservice.client.NotificationFeignClient;
import com.example.orderservice.client.ProductFeignClient;
import com.example.orderservice.client.UserServiceClient;
import com.example.orderservice.exception.ResourceNotFoundException;
import com.example.orderservice.model.Order;
import com.example.orderservice.model.OrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit-тесты бизнес-логики. Все внешние зависимости замокированы —
 * никаких Spring-контекстов, никаких портов, тест запускается мгновенно.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OrderService")
class OrderServiceTest {

    @Mock OrderRepository          orderRepository;
    @Mock ProductFeignClient       productFeignClient;
    @Mock NotificationFeignClient  notificationFeignClient;
    @Mock UserServiceClient        userServiceClient;
    @Mock RequestLogService        requestLogService;

    @InjectMocks OrderService orderService;

    // ── Общие фикстуры ────────────────────────────────────────────────────────

    private OrderRequest request;
    private ProductResponse product;

    @BeforeEach
    void setUp() {
        request = new OrderRequest();
        request.setRequestId("req-uid-001");
        request.setUserId(10);
        request.setProductId(5);
        request.setQuantity(2);
        request.setUserEmail("buyer@test.com");
        request.setUserName("Покупатель");

        product = new ProductResponse();
        product.setId(5);
        product.setName("Ноутбук");
        product.setPrice(new BigDecimal("50000.00"));
        product.setStock(10);
        product.setActive(true);
    }

    // ── createOrder ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createOrder()")
    class CreateOrder {

        @Test
        @DisplayName("позитивный сценарий: заказ сохраняется со статусом PENDING")
        void givenValidRequest_whenCreateOrder_thenOrderSavedAsPending() {
            // Arrange
            given(requestLogService.isDuplicate(request.getRequestId())).willReturn(false);
            given(productFeignClient.getProduct(5)).willReturn(product);
            given(orderRepository.save(any(Order.class))).willAnswer(inv -> {
                Order o = inv.getArgument(0);
                o.setId(1);
                return o;
            });

            // Act
            Order result = orderService.createOrder(request);

            // Assert
            assertThat(result.getId()).isEqualTo(1);
            assertThat(result.getStatus()).isEqualTo(OrderStatus.PENDING);
            assertThat(result.getTotalPrice()).isEqualByComparingTo("100000.00"); // 50000 * 2

            then(orderRepository).should().save(any(Order.class));
            then(productFeignClient).should().decreaseStock(eq(5), any());
            then(requestLogService).should().logRequest(request.getRequestId());
        }

        @Test
        @DisplayName("дублирующийся requestId → IllegalStateException, в БД ничего не сохраняется")
        void givenDuplicateRequestId_whenCreateOrder_thenThrowsIllegalState() {
            // Arrange
            given(requestLogService.isDuplicate(request.getRequestId())).willReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> orderService.createOrder(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Duplicate request");

            then(orderRepository).shouldHaveNoInteractions();
            then(productFeignClient).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("товар не существует → ResourceNotFoundException от productFeignClient")
        void givenMissingProduct_whenCreateOrder_thenPropagatesFeignException() {
            // Arrange
            given(requestLogService.isDuplicate(any())).willReturn(false);
            given(productFeignClient.getProduct(5))
                    .willThrow(new ResourceNotFoundException("Product not found: 5"));

            // Act & Assert
            assertThatThrownBy(() -> orderService.createOrder(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Product not found: 5");

            then(orderRepository).shouldHaveNoInteractions();
        }
    }

    // ── getOrderById ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getOrderById()")
    class GetOrderById {

        @Test
        @DisplayName("заказ существует → возвращает Order")
        void givenExistingId_whenGetById_thenReturnsOrder() {
            // Arrange
            Order stored = Order.builder().id(42).userId(10).status(OrderStatus.PENDING).build();
            given(orderRepository.findById(42)).willReturn(Optional.of(stored));

            // Act
            Order result = orderService.getOrderById(42);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(42);
            assertThat(result.getStatus()).isEqualTo(OrderStatus.PENDING);
        }

        @Test
        @DisplayName("заказ не существует → ResourceNotFoundException")
        void givenMissingId_whenGetById_thenThrowsNotFoundException() {
            // Arrange
            given(orderRepository.findById(999)).willReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> orderService.getOrderById(999))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessage("Order not found with id: 999");
        }
    }

    // ── getOrdersByUserId ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("getOrdersByUserId()")
    class GetOrdersByUser {

        @Test
        @DisplayName("возвращает только заказы нужного пользователя")
        void givenUserId_whenGetOrders_thenReturnsOnlyHisOrders() {
            // Arrange
            List<Order> userOrders = List.of(
                    Order.builder().id(1).userId(10).build(),
                    Order.builder().id(2).userId(10).build()
            );
            given(orderRepository.findByUserId(10)).willReturn(userOrders);

            // Act
            List<Order> result = orderService.getOrdersByUserId(10);

            // Assert
            assertThat(result).hasSize(2);
            assertThat(result).allMatch(o -> o.getUserId().equals(10));
        }
    }

    // ── cancelOrder ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("cancelOrder()")
    class CancelOrder {

        @Test
        @DisplayName("PENDING → CANCELLED")
        void givenPendingOrder_whenCancel_thenStatusIsCancelled() {
            // Arrange
            Order pending = Order.builder().id(3).status(OrderStatus.PENDING).build();
            given(orderRepository.findById(3)).willReturn(Optional.of(pending));
            given(orderRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            // Act
            Order result = orderService.cancelOrder(3);

            // Assert
            assertThat(result.getStatus()).isEqualTo(OrderStatus.CANCELLED);
            then(orderRepository).should().save(pending);
        }
    }
}
