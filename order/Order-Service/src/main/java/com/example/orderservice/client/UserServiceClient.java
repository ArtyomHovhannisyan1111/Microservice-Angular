package com.example.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.math.BigDecimal;
import java.util.Map;

@FeignClient(name = "user-service", url = "${USER_SERVICE_URL:http://localhost:8088}", path = "/api/users")
public interface UserServiceClient {

    @PostMapping("/{id}/deduct-balance")
    void deductBalance(@PathVariable("id") Integer id,
                       @RequestBody Map<String, BigDecimal> request);

    @PutMapping("/{id}/balance/top-up")
    void topUpBalance(@PathVariable("id") Integer id,
                      @RequestBody Map<String, BigDecimal> request);
}
