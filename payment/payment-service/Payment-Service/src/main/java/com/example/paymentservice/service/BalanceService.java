package com.example.paymentservice.service;

import com.example.paymentservice.Exception.CardNotFoundException;
import com.example.paymentservice.Util.PaymentMathUtils;
import com.example.paymentservice.dto.TopUpRequest;
import com.example.paymentservice.dto.TopUpResponse;
import com.example.paymentservice.model.PaymentMethod;
import com.example.paymentservice.repository.PaymentMethodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BalanceService {

    private final PaymentMethodRepository paymentMethodRepository;
    private final RestClient restClient;

    @Value("${USER_SERVICE_URL}")
    private String userServiceUrl;

    @Transactional
    public TopUpResponse depositToCard(Long userId, TopUpRequest request) {
        PaymentMethod card = findCard(request.getPaymentMethodId());
        PaymentMathUtils.validateOwner(card, userId);
        PaymentMathUtils.validateActive(card);
        PaymentMathUtils.validatePositiveAmount(request.getAmount());

        card.setAmount((card.getAmount() != null ? card.getAmount() : BigDecimal.ZERO).add(request.getAmount()));
        paymentMethodRepository.save(card);

        return buildResponse(card, request.getAmount(), "Средства зачислены на карту");
    }

    @Transactional
    public TopUpResponse transferToUser(Long userId, TopUpRequest request) {
        PaymentMethod card = findCard(request.getPaymentMethodId());
        PaymentMathUtils.validateOwner(card, userId);
        PaymentMathUtils.validateActive(card);
        PaymentMathUtils.validatePositiveAmount(request.getAmount());
        PaymentMathUtils.validateFunds(card.getAmount(), request.getAmount());

        Long targetUserId = request.getWalletUserId() != null ? request.getWalletUserId() : userId;
        restClient.put()
                .uri(userServiceUrl + "/api/users/" + targetUserId + "/balance/top-up")
                .body(Map.of("amount", request.getAmount()))
                .retrieve()
                .toBodilessEntity();

        card.setAmount(card.getAmount().subtract(request.getAmount()));
        paymentMethodRepository.save(card);

        return buildResponse(card, request.getAmount(), "Փոխանցումը հաջողվեց");
    }

    private PaymentMethod findCard(Long id) {
        return paymentMethodRepository.findById(id)
                .orElseThrow(() -> new CardNotFoundException(id));
    }

    private TopUpResponse buildResponse(PaymentMethod card, BigDecimal amount, String message) {
        return TopUpResponse.builder()
                .cardId(card.getId())
                .maskedPan(card.getMaskedNumber())
                .brand(card.getProviderName())
                .amount(amount)
                .message(message)
                .build();
    }
}
