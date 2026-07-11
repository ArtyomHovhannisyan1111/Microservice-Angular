package com.example.paymentservice.mapper;

import com.example.paymentservice.Util.PaymentStringUtils;
import com.example.paymentservice.dto.PaymentMethodRequest;
import com.example.paymentservice.dto.PaymentMethodResponse;
import com.example.paymentservice.model.PaymentMethod;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class PaymentMethodMapper {
    public PaymentMethod toEntity(PaymentMethodRequest request) {
        if (request == null) {
            return null;
        }
        String genereatedToken = "token" + UUID.randomUUID().toString().substring(0, 8);
        String maskedNumber = PaymentStringUtils.maskCardNumber(request.getRawNumber());
        return PaymentMethod.builder()
                .userId(request.getUserId())
                .type(request.getType())
                .providerName(request.getProviderName())
                .accountToken(genereatedToken)
                .maskedNumber(maskedNumber)
                .cardholderName(request.getCardholderName())
                .cvv(request.getCvv())
                .isActive(true)
                .amount(BigDecimal.ZERO)
                .build();

    }

    public PaymentMethodResponse toResponse(PaymentMethod response) {
        if (response==null){
            return null;
        }
        return  new PaymentMethodResponse(
                response.getId(),
                response.getUserId(),
                response.getType(),
                response.getProviderName(),
                response.getMaskedNumber(),
                response.getCardholderName(),
                response.isActive(),
                response.getAmount() != null ? response.getAmount() : BigDecimal.ZERO
        );

    }

}
