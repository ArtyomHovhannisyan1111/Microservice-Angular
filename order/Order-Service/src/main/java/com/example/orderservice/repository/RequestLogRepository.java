package com.example.orderservice.repository;

import com.example.orderservice.model.RequestLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;

public interface RequestLogRepository extends JpaRepository<RequestLog, String> {

    @Modifying
    @Query("DELETE FROM RequestLog r WHERE r.processedAt < :threshold")
    void deleteByProcessedAtBefore(LocalDateTime threshold);
}