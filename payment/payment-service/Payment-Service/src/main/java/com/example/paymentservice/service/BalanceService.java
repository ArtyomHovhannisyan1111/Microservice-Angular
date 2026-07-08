package com.example.paymentservice.service;

import com.example.paymentservice.Exception.CardAccessDeniedException;
import com.example.paymentservice.Exception.CardNotFoundException;
import com.example.paymentservice.dto.TopUpRequest;
import com.example.paymentservice.dto.TopUpResponse;
import com.example.paymentservice.model.PaymentMethod;
import com.example.paymentservice.repository.PaymentMethodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BalanceService {

    private final PaymentMethodRepository paymentMethodRepository;

    public TopUpResponse validateTopUp(Long userId, TopUpRequest request) {
        PaymentMethod paymentMethod = paymentMethodRepository.findById(request.getPaymentMethodId())
                .orElseThrow(() -> new CardNotFoundException(request.getPaymentMethodId()));

        if (!paymentMethod.getUserId().equals(userId)) {
            throw new CardAccessDeniedException(request.getPaymentMethodId(), userId);
        }

        return TopUpResponse.builder()
                .cardId(paymentMethod.getId())
                .maskedPan(paymentMethod.getMaskedNumber())
                .brand(paymentMethod.getProviderName())
                .amount(request.getAmount())
                .message("Карта верифицирована успешно")
                .build();
    }
}