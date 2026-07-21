package com.example.orderservice.repository;

import com.example.orderservice.model.RequestLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestLogRepository extends JpaRepository<RequestLog, String> {
}