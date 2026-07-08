package com.example.paymentservice.service;

import com.example.paymentservice.dto.PaymentMethodRequest;
import com.example.paymentservice.dto.PaymentMethodResponse;
import com.example.paymentservice.mapper.PaymentMethodMapper;
import com.example.paymentservice.model.PaymentMethod;
import com.example.paymentservice.repository.PaymentMethodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentMethodService {
    private final PaymentMethodRepository paymentMethodRepository;
    private final PaymentMethodMapper paymnentMethodMapper;

    public PaymentMethodResponse save(PaymentMethodRequest paymentMethodRequest) {
        PaymentMethod paymentMethod=paymnentMethodMapper.toEntity(paymentMethodRequest);
        PaymentMethod save=paymentMethodRepository.save(paymentMethod);
        return paymnentMethodMapper.toResponse(save);
    }
    public List<PaymentMethodResponse> getMethodsByUserId(Long userId) {
       return paymentMethodRepository.findByUserId(userId).stream()
               .map(paymnentMethodMapper::toResponse)
               .toList();

    }
}
