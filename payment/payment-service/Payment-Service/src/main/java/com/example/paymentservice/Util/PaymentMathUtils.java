package com.example.paymentservice.Util;

import com.example.paymentservice.Exception.CardAccessDeniedException;
import com.example.paymentservice.model.PaymentMethod;
import lombok.experimental.UtilityClass;

import java.math.BigDecimal;

@UtilityClass
public class PaymentMathUtils {
    public static void validatePositiveAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
    }
        public static void validateOwner(PaymentMethod card, Long userId) {
            if (!card.getUserId().equals(userId)) {
                throw new CardAccessDeniedException(card.getId(), userId);
            }
        }
    public static void validateActive(PaymentMethod card) {
        if (!card.isActive()) {
            throw new IllegalArgumentException("Card is not active");
        }
    }

    public static void validateFunds(BigDecimal currentBalance, BigDecimal amountRequired) {
        BigDecimal balance = currentBalance != null ? currentBalance : BigDecimal.ZERO;
        if (balance.compareTo(amountRequired) < 0) {
            throw new IllegalArgumentException("Insufficient funds");
        }
    }

}
