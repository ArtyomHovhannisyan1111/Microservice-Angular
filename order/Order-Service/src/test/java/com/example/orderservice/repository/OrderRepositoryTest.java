package com.example.orderservice.repository;

import com.example.orderservice.model.Order;
import com.example.orderservice.model.OrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("OrderRepository")
class OrderRepositoryTest {

    @Autowired TestEntityManager em;
    @Autowired OrderRepository   orderRepository;

    private Order persist(Integer userId, OrderStatus status) {
        Order o = Order.builder()
                .userId(userId)
                .productId(1)
                .quantity(2)
                .totalPrice(new BigDecimal("1000.00"))
                .status(status)
                .build();
        return em.persistAndFlush(o);
    }

    @BeforeEach
    void seed() {
        persist(10, OrderStatus.PENDING);
        persist(10, OrderStatus.APPROVED);
        persist(20, OrderStatus.PENDING);
    }

    @Nested
    @DisplayName("findByUserId()")
    class FindByUserId {

        @Test
        @DisplayName("возвращает только заказы указанного пользователя")
        void givenUserId10_thenReturnsHisTwoOrders() {
            List<Order> result = orderRepository.findByUserId(10);

            assertThat(result)
                    .hasSize(2)
                    .allSatisfy(o -> assertThat(o.getUserId()).isEqualTo(10));
        }

        @Test
        @DisplayName("пользователь без заказов → пустой список")
        void givenUnknownUserId_thenReturnsEmptyList() {
            List<Order> result = orderRepository.findByUserId(999);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByStatus()")
    class FindByStatus {

        @Test
        @DisplayName("PENDING → возвращает два заказа (от разных пользователей)")
        void givenStatusPending_thenReturnsTwoOrders() {
            List<Order> result = orderRepository.findByStatus(OrderStatus.PENDING);

            assertThat(result)
                    .hasSize(2)
                    .allSatisfy(o -> assertThat(o.getStatus()).isEqualTo(OrderStatus.PENDING));
        }

        @Test
        @DisplayName("CANCELLED → пустой список (в сиде нет таких заказов)")
        void givenStatusCancelled_thenReturnsEmpty() {
            List<Order> result = orderRepository.findByStatus(OrderStatus.CANCELLED);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("save() + findById()")
    class SaveAndFind {

        @Test
        @DisplayName("сохранённый заказ находится по id с корректными полями")
        void givenNewOrder_whenSaved_thenFoundById() {
            Order newOrder = Order.builder()
                    .userId(30)
                    .productId(5)
                    .quantity(1)
                    .totalPrice(new BigDecimal("4999.00"))
                    .status(OrderStatus.PENDING)
                    .userEmail("new@test.com")
                    .build();

            Order saved = orderRepository.save(newOrder);
            em.flush();
            em.clear();

            Order found = orderRepository.findById(saved.getId()).orElseThrow();

            assertThat(found.getUserId()).isEqualTo(30);
            assertThat(found.getTotalPrice()).isEqualByComparingTo("4999.00");
            assertThat(found.getStatus()).isEqualTo(OrderStatus.PENDING);
            assertThat(found.getCreatedAt()).isNotNull();
        }
    }
}
