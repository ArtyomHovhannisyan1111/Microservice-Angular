package com.example.orderservice.service;

import com.example.orderservice.repository.RequestLogRepository;
import com.example.orderservice.model.RequestLog;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RequestLogService {

    private final RequestLogRepository requestLogRepository;

    public boolean isDuplicate(String requestId) {
        return requestLogRepository.existsById(requestId);
    }

    @Transactional
    public void logRequest(String requestId) {
        RequestLog requestLog = RequestLog.builder()
                .requestId(requestId)
                .processedAt(LocalDateTime.now())
                .build();
        requestLogRepository.save(requestLog);
    }
}