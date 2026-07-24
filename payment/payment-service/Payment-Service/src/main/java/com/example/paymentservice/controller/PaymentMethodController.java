package com.example.paymentservice.controller;

import com.example.paymentservice.Exception.CardAccessDeniedException;
import com.example.paymentservice.dto.PaymentMethodRequest;
import com.example.paymentservice.dto.PaymentMethodResponse;
import com.example.paymentservice.service.PaymentMethodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payment-methods")
public class PaymentMethodController {
    private final PaymentMethodService paymentMethodService;

    @PostMapping
    public ResponseEntity<PaymentMethodResponse> createPaymentMethod(
            @Valid @RequestBody PaymentMethodRequest paymentMethod,
            @RequestHeader("X-User-Id") Long callerId) {
        if (!callerId.equals(paymentMethod.getUserId())) {
            throw new CardAccessDeniedException("Cannot create payment method for another user");
        }
        return new ResponseEntity<>(paymentMethodService.save(paymentMethod), HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PaymentMethodResponse>> getMethodsByUserId(
            @PathVariable Long userId,
            @RequestHeader("X-User-Id") Long callerId) {
        if (!callerId.equals(userId)) {
            throw new CardAccessDeniedException("Access to another user's payment methods is forbidden");
        }
        return ResponseEntity.ok(paymentMethodService.getMethodsByUserId(userId));
    }
}
