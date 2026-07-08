package com.example.productservice.repository;

import com.example.productservice.model.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@DisplayName("ProductRepository")
class ProductRepositoryTest {

    @Autowired TestEntityManager em;
    @Autowired ProductRepository repo;

    @BeforeEach
    void seed() {
        em.persistAndFlush(Product.builder().name("Ноутбук").price(new BigDecimal("80000")).quantity(5).category("Электроника").build());
        em.persistAndFlush(Product.builder().name("Мышь").price(new BigDecimal("1500")).quantity(3).category("Периферия").build());
        em.persistAndFlush(Product.builder().name("Монитор").price(new BigDecimal("25000")).quantity(2).category("Электроника").build());
    }

    @Nested @DisplayName("existsByNameIgnoreCase()")
    class ExistsByName {

        @Test @DisplayName("совпадение в разных регистрах → true")
        void givenUppercase_thenTrue() {
            assertThat(repo.existsByNameIgnoreCase("НОУТБУК")).isTrue();
        }

        @Test @DisplayName("несуществующее имя → false")
        void givenUnknown_thenFalse() {
            assertThat(repo.existsByNameIgnoreCase("Планшет")).isFalse();
        }
    }

    @Nested @DisplayName("findByNameContainingIgnoreCase()")
    class SearchByName {

        @Test @DisplayName("подстрока 'ноут' → находит Ноутбук")
        void givenPartial_thenFindsMatch() {
            List<Product> result = repo.findByNameContainingIgnoreCase("ноут");
            assertThat(result).hasSize(1)
                    .first().extracting(Product::getName).isEqualTo("Ноутбук");
        }
    }

    @Nested @DisplayName("findByQuantityLessThanEqual()")
    class LowStock {

        @Test @DisplayName("порог 3 → возвращает товары с количеством ≤ 3")
        void givenThreshold3_thenReturnsTwoProducts() {
            List<Product> result = repo.findByQuantityLessThanEqual(3);
            assertThat(result).hasSize(2)
                    .allSatisfy(p -> assertThat(p.getQuantity()).isLessThanOrEqualTo(3));
        }

        @Test @DisplayName("порог 0 → пустой список")
        void givenThreshold0_thenEmpty() {
            assertThat(repo.findByQuantityLessThanEqual(0)).isEmpty();
        }
    }
}
