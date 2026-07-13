package com.example.paymentservice.Exception;

public class CardAccessDeniedException extends RuntimeException {
    public CardAccessDeniedException(Long cardId, Long userId) {
        super("Card " + cardId + " does not belong to user " + userId);
    }

    public CardAccessDeniedException(String message) {
        super(message);
    }
}
