package com.example.orderservice.repository;

import com.example.orderservice.Repository.OrderRepository;
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

/**
 * Интеграционный тест репозитория.
 * @DataJpaTest поднимает встроенный H2, применяет только JPA-слой —
 * контроллеры, сервисы и Kafka не загружаются.
 * Каждый тест выполняется в транзакции и откатывается после завершения.
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("OrderRepository")
class OrderRepositoryTest {

    @Autowired TestEntityManager em;
    @Autowired OrderRepository   orderRepository;

    // ── Фикстуры ──────────────────────────────────────────────────────────────

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

    // ── findByUserId ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("findByUserId()")
    class FindByUserId {

        @Test
        @DisplayName("возвращает только заказы указанного пользователя")
        void givenUserId10_thenReturnsHisTwoOrders() {
            // Act
            List<Order> result = orderRepository.findByUserId(10);

            // Assert
            assertThat(result)
                    .hasSize(2)
                    .allSatisfy(o -> assertThat(o.getUserId()).isEqualTo(10));
        }

        @Test
        @DisplayName("пользователь без заказов → пустой список")
        void givenUnknownUserId_thenReturnsEmptyList() {
            // Act
            List<Order> result = orderRepository.findByUserId(999);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    // ── findByStatus ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("findByStatus()")
    class FindByStatus {

        @Test
        @DisplayName("PENDING → возвращает два заказа (от разных пользователей)")
        void givenStatusPending_thenReturnsTwoOrders() {
            // Act
            List<Order> result = orderRepository.findByStatus(OrderStatus.PENDING);

            // Assert
            assertThat(result)
                    .hasSize(2)
                    .allSatisfy(o -> assertThat(o.getStatus()).isEqualTo(OrderStatus.PENDING));
        }

        @Test
        @DisplayName("CANCELLED → пустой список (в сиде нет таких заказов)")
        void givenStatusCancelled_thenReturnsEmpty() {
            // Act
            List<Order> result = orderRepository.findByStatus(OrderStatus.CANCELLED);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    // ── save / findById ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("save() + findById()")
    class SaveAndFind {

        @Test
        @DisplayName("сохранённый заказ находится по id с корректными полями")
        void givenNewOrder_whenSaved_thenFoundById() {
            // Arrange
            Order newOrder = Order.builder()
                    .userId(30)
                    .productId(5)
                    .quantity(1)
                    .totalPrice(new BigDecimal("4999.00"))
                    .status(OrderStatus.PENDING)
                    .userEmail("new@test.com")
                    .build();

            // Act
            Order saved = orderRepository.save(newOrder);
            em.flush();
            em.clear(); // выбрасываем из кэша — следующий поиск идёт в БД

            Order found = orderRepository.findById(saved.getId()).orElseThrow();

            // Assert
            assertThat(found.getUserId()).isEqualTo(30);
            assertThat(found.getTotalPrice()).isEqualByComparingTo("4999.00");
            assertThat(found.getStatus()).isEqualTo(OrderStatus.PENDING);
            assertThat(found.getCreatedAt()).isNotNull();
        }
    }
}
