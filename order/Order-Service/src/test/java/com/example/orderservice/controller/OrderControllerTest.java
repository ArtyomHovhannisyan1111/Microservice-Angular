package com.example.orderservice.controller;

import com.example.orderservice.Dto.OrderRequest;
import com.example.orderservice.exception.GlobalExceptionHandler;
import com.example.orderservice.exception.ResourceNotFoundException;
import com.example.orderservice.model.Order;
import com.example.orderservice.model.OrderStatus;
import com.example.orderservice.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit-тесты Web-слоя. Поднимается только MVC-контекст (без БД, Kafka, Feign).
 * @WebMvcTest автоматически включает @ControllerAdvice, поэтому GlobalExceptionHandler
 * подхватывается без дополнительных настроек.
 */
@WebMvcTest(OrderController.class)
@Import(GlobalExceptionHandler.class)
@DisplayName("OrderController")
class OrderControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean OrderService orderService;

    // ── Фабричные методы ──────────────────────────────────────────────────────

    private OrderRequest validRequest() {
        OrderRequest r = new OrderRequest();
        r.setRequestId("req-001");
        r.setUserId(42);
        r.setProductId(7);
        r.setQuantity(3);
        r.setUserEmail("user@example.com");
        r.setUserName("Иван");
        return r;
    }

    private Order savedOrder() {
        return Order.builder()
                .id(1)
                .userId(42)
                .productId(7)
                .quantity(3)
                .totalPrice(new BigDecimal("2999.97"))
                .status(OrderStatus.PENDING)
                .build();
    }

    // ── POST /api/orders ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/orders")
    class CreateOrder {

        @Test
        @DisplayName("валидный запрос → 201 Created с телом заказа")
        void givenValidRequest_whenCreateOrder_thenReturns201() throws Exception {
            // Arrange
            given(orderService.createOrder(any())).willReturn(savedOrder());

            // Act & Assert
            mockMvc.perform(post("/api/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest())))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.status").value("pending"))
                    .andExpect(jsonPath("$.totalPrice").value(2999.97));
        }

        @Test
        @DisplayName("пустой requestId → 400 Bad Request с сообщением валидации")
        void givenBlankRequestId_whenCreateOrder_thenReturns400() throws Exception {
            // Arrange
            OrderRequest bad = validRequest();
            bad.setRequestId("");        // @NotBlank

            // Act & Assert
            mockMvc.perform(post("/api/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(bad)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.requestId").value("Request ID cannot be blank"));
        }

        @Test
        @DisplayName("quantity = 0 → 400 Bad Request (@Positive)")
        void givenZeroQuantity_whenCreateOrder_thenReturns400() throws Exception {
            // Arrange
            OrderRequest bad = validRequest();
            bad.setQuantity(0);          // @Positive

            // Act & Assert
            mockMvc.perform(post("/api/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(bad)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.quantity").value("Quantity must be greater than zero"));
        }

        @Test
        @DisplayName("quantity > 1000 → 400 Bad Request (@Max)")
        void givenQuantityOverMax_whenCreateOrder_thenReturns400() throws Exception {
            // Arrange
            OrderRequest bad = validRequest();
            bad.setQuantity(1001);       // @Max(1000)

            // Act & Assert
            mockMvc.perform(post("/api/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(bad)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.quantity").value("Quantity cannot exceed 1000"));
        }

        @Test
        @DisplayName("null userId → 400 Bad Request (@NotNull)")
        void givenNullUserId_whenCreateOrder_thenReturns400() throws Exception {
            // Arrange
            OrderRequest bad = validRequest();
            bad.setUserId(null);         // @NotNull

            // Act & Assert
            mockMvc.perform(post("/api/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(bad)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.userId").value("User ID cannot be null"));
        }
    }

    // ── GET /api/orders/{id} ──────────────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/orders/{id}")
    class GetOrderById {

        @Test
        @DisplayName("существующий id → 200 OK с заказом")
        void givenExistingId_whenGetById_thenReturns200() throws Exception {
            // Arrange
            given(orderService.getOrderById(1)).willReturn(savedOrder());

            // Act & Assert
            mockMvc.perform(get("/api/orders/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.userId").value(42));
        }

        @Test
        @DisplayName("несуществующий id → 404 Not Found через GlobalExceptionHandler")
        void givenMissingId_whenGetById_thenReturns404() throws Exception {
            // Arrange
            given(orderService.getOrderById(999))
                    .willThrow(new ResourceNotFoundException("Order not found with id: 999"));

            // Act & Assert
            mockMvc.perform(get("/api/orders/999"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.error").value("Order not found with id: 999"));
        }
    }
}
