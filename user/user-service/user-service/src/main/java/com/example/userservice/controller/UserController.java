package com.example.userservice.controller;

import com.example.userservice.dto.UserRegisterDto;
import com.example.userservice.dto.UserResponse;
import com.example.userservice.mapper.UserMapper;
import com.example.userservice.model.User;
import com.example.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final UserMapper userMapper;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> registerUser(@RequestBody UserRegisterDto request) {
        User userEntity = userMapper.toEntity(request);
        User savedUser = userService.registeredUser(userEntity);
        return ResponseEntity.ok(userMapper.toResponse(savedUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        User user = userService.getById(id);
        return ResponseEntity.ok(userMapper.toResponse(user));
    }

    @PutMapping("/{id}/balance/top-up")
    public ResponseEntity<UserResponse> topUpBalance(@PathVariable Long id, @RequestBody Map<String, BigDecimal> request) {
        BigDecimal amount = request.get("amount");
        User updatedUser = userService.topUpBalance(id, amount);
        return ResponseEntity.ok(userMapper.toResponse(updatedUser));
    }

    @PostMapping("/{id}/deduct-balance")
    public ResponseEntity<Map<String, Object>> deductBalance(@PathVariable Long id, @RequestBody Map<String, BigDecimal> request) {
        BigDecimal orderTotal = request.get("amount");
        boolean isSuccess = userService.deductBalance(id, orderTotal);
        if (isSuccess) {
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "the amount was charged successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("status", "FAILED", "message", "Insufficient funds in balance"));
        }
    }

}
