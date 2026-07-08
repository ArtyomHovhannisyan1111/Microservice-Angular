package com.example.paymentservice.controller;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payment-methods")
public class PaymentMethodController {
    private final PaymentMethodService paymentMethodService;

    @PostMapping
    public ResponseEntity<PaymentMethodResponse> createPaymentMethod(@Valid @RequestBody PaymentMethodRequest paymentMethod) {
        PaymentMethodResponse paymentMethodResponse = paymentMethodService.save(paymentMethod);
        return new ResponseEntity<>(paymentMethodResponse, HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PaymentMethodResponse>> getMethodsByUserId(@PathVariable Long userId) {
        List<PaymentMethodResponse> responses = paymentMethodService.getMethodsByUserId(userId);
        return ResponseEntity.ok(responses);

    }
}
