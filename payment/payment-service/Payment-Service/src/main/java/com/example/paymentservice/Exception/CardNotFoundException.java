package com.example.paymentservice.Exception;

public class CardNotFoundException extends RuntimeException {
    public CardNotFoundException(Long cardId) {
        super("Card not found: " + cardId);
    }
}
