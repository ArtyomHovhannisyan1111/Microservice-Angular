package com.example.paymentservice.repository;

import com.example.paymentservice.model.PaymentMethod;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@DisplayName("PaymentMethodRepository")
class PaymentMethodRepositoryTest {

    @Autowired TestEntityManager      em;
    @Autowired PaymentMethodRepository repo;

    @BeforeEach
    void seed() {
        em.persistAndFlush(PaymentMethod.builder()
                .userId(1L).type("CARD").providerName("Visa")
                .accountToken("tok1").maskedNumber("**** 1111")
                .cardholderName("Ivan").isActive(true).build());
        em.persistAndFlush(PaymentMethod.builder()
                .userId(1L).type("CARD").providerName("MasterCard")
                .accountToken("tok2").maskedNumber("**** 2222")
                .cardholderName("Ivan").isActive(false).build());
        em.persistAndFlush(PaymentMethod.builder()
                .userId(2L).type("CARD").providerName("Mir")
                .accountToken("tok3").maskedNumber("**** 3333")
                .cardholderName("Maria").isActive(true).build());
        em.clear();
    }

    @Nested @DisplayName("findByUserId()")
    class FindByUserId {

        @Test @DisplayName("userId=1 → две карты")
        void givenUser1_thenReturnsTwoCards() {
            List<PaymentMethod> result = repo.findByUserId(1L);
            assertThat(result).hasSize(2)
                    .allSatisfy(pm -> assertThat(pm.getUserId()).isEqualTo(1L));
        }

        @Test @DisplayName("userId=2 → одна карта")
        void givenUser2_thenReturnsOneCard() {
            List<PaymentMethod> result = repo.findByUserId(2L);
            assertThat(result).hasSize(1)
                    .first().extracting(PaymentMethod::getProviderName).isEqualTo("Mir");
        }

        @Test @DisplayName("несуществующий userId → пустой список")
        void givenUnknownUser_thenEmpty() {
            assertThat(repo.findByUserId(99L)).isEmpty();
        }
    }
}
