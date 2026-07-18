package com.example.paymentservice.service;

import com.example.paymentservice.Exception.CardAccessDeniedException;
import com.example.paymentservice.Exception.CardNotFoundException;
import com.example.paymentservice.dto.TopUpRequest;
import com.example.paymentservice.dto.TopUpResponse;
import com.example.paymentservice.model.PaymentMethod;
import com.example.paymentservice.repository.PaymentMethodRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BalanceService")
class BalanceServiceTest {

    @Mock PaymentMethodRepository repo;
    @InjectMocks BalanceService service;

    private PaymentMethod card;
    private TopUpRequest  request;

    @BeforeEach
    void setUp() {
        card = PaymentMethod.builder()
                .id(10L).userId(42L).maskedNumber("**** 1234")
                .providerName("Visa").type("CARD").accountToken("tok")
                .cardholderName("Ivan").isActive(true).build();

        request = new TopUpRequest();
        request.setPaymentMethodId(10L);
        request.setAmount(new BigDecimal("3000"));
    }

    @Nested @DisplayName("depositToCard()")
    class DepositToCard {

        @Test @DisplayName("владелец карты пополняет → возвращает TopUpResponse")
        void givenOwner_whenDeposit_thenReturnsResponse() {
            given(repo.findById(10L)).willReturn(Optional.of(card));
            given(repo.save(any())).willReturn(card);

            TopUpResponse response = service.depositToCard(42L, request);

            assertThat(response.getCardId()).isEqualTo(10L);
            assertThat(response.getMaskedPan()).isEqualTo("**** 1234");
            assertThat(response.getAmount()).isEqualByComparingTo("3000");
            assertThat(response.getBrand()).isEqualTo("Visa");
        }

        @Test @DisplayName("карта не существует → CardNotFoundException")
        void givenMissingCard_whenDeposit_thenThrows() {
            given(repo.findById(10L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> service.depositToCard(42L, request))
                    .isInstanceOf(CardNotFoundException.class)
                    .hasMessageContaining("10");
        }

        @Test @DisplayName("чужой userId → CardAccessDeniedException")
        void givenWrongUser_whenDeposit_thenThrows() {
            given(repo.findById(10L)).willReturn(Optional.of(card));

            assertThatThrownBy(() -> service.depositToCard(99L, request))
                    .isInstanceOf(CardAccessDeniedException.class);
        }
    }
}
