package com.example.paymentservice.controller;

import com.example.paymentservice.Util.JwtUtil;
import com.example.paymentservice.dto.TopUpRequest;
import com.example.paymentservice.dto.TopUpResponse;
import com.example.paymentservice.service.BalanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/balance")
public class BalanceController {

    private final BalanceService balanceService;
    private final JwtUtil jwtUtil;

    @PostMapping("/deposit")
    public ResponseEntity<TopUpResponse> deposit(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody TopUpRequest request) {
        Long userId = jwtUtil.extractUserId(authHeader);
        return ResponseEntity.ok(balanceService.depositToCard(userId, request));
    }

    @PostMapping("/transfer")
    public ResponseEntity<TopUpResponse> transfer(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody TopUpRequest request) {
        Long userId = jwtUtil.extractUserId(authHeader);
        return ResponseEntity.ok(balanceService.transferToUser(userId, request));
    }
}