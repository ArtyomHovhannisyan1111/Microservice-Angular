package com.example.orderservice.service;

import com.example.orderservice.model.RequestLog;
import com.example.orderservice.repository.RequestLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class RequestLogService {

    private final RequestLogRepository requestLogRepository;

    /**
     * Atomically checks and records the requestId in its own transaction.
     * REQUIRES_NEW ensures the record is committed immediately — before any
     * external Feign calls — so concurrent or retried requests are rejected
     * at the DB constraint level, not via a separate read-then-write check.
     *
     * Throws IllegalStateException if the requestId was already processed.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void ensureUnique(String requestId) {
        try {
            requestLogRepository.saveAndFlush(
                    RequestLog.builder()
                            .requestId(requestId)
                            .processedAt(LocalDateTime.now())
                            .build()
            );
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Duplicate request: " + requestId);
        }
    }

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanup() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        requestLogRepository.deleteByProcessedAtBefore(cutoff);
        log.info("Cleaned up request_logs older than {}", cutoff);
    }
}