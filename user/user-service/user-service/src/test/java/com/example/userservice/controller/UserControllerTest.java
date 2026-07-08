package com.example.userservice.controller;

import com.example.userservice.dto.UserRegisterDto;
import com.example.userservice.dto.UserResponse;
import com.example.userservice.mapper.UserMapper;
import com.example.userservice.model.User;
import com.example.userservice.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@DisplayName("UserController")
class UserControllerTest {

    @Autowired MockMvc     mockMvc;
    @Autowired ObjectMapper mapper;
    @MockBean  UserService userService;
    @MockBean  UserMapper  userMapper;

    private User savedUser() {
        return new User(1L, "ivan", "ivan@mail.ru", "hashed", "USER", BigDecimal.ZERO);
    }

    private UserResponse userResponse() {
        return new UserResponse(1L, "ivan", "ivan@mail.ru", "USER", BigDecimal.ZERO);
    }

    @Nested @DisplayName("POST /api/users/register")
    class Register {

        @Test @DisplayName("валидный запрос → 200 с UserResponse")
        void givenValid_whenRegister_thenReturns200() throws Exception {
            UserRegisterDto dto = new UserRegisterDto("ivan", "pass", "ivan@mail.ru");

            given(userMapper.toEntity(any())).willReturn(savedUser());
            given(userService.registeredUser(any())).willReturn(savedUser());
            given(userMapper.toResponse(any())).willReturn(userResponse());

            mockMvc.perform(post("/api/users/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.username").value("ivan"))
                    .andExpect(jsonPath("$.role").value("USER"));
        }
    }

    @Nested @DisplayName("GET /api/users/{id}")
    class GetById {

        @Test @DisplayName("существующий id → 200 с данными пользователя")
        void givenExistingId_thenReturns200() throws Exception {
            given(userService.getById(1L)).willReturn(savedUser());
            given(userMapper.toResponse(any())).willReturn(userResponse());

            mockMvc.perform(get("/api/users/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.username").value("ivan"));
        }
    }

    @Nested @DisplayName("PUT /api/users/{id}/balance/top-up")
    class TopUp {

        @Test @DisplayName("корректная сумма → 200 с обновлённым балансом")
        void givenAmount_whenTopUp_thenReturns200() throws Exception {
            User updated = new User(1L, "ivan", "ivan@mail.ru", "hashed", "USER", new BigDecimal("1000"));
            UserResponse resp = new UserResponse(1L, "ivan", "ivan@mail.ru", "USER", new BigDecimal("1000"));

            given(userService.topUpBalance(any(), any())).willReturn(updated);
            given(userMapper.toResponse(any())).willReturn(resp);

            mockMvc.perform(put("/api/users/1/balance/top-up")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(Map.of("amount", 1000))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.balance").value(1000));
        }
    }

    @Nested @DisplayName("POST /api/users/{id}/deduct-balance")
    class Deduct {

        @Test @DisplayName("достаточный баланс → 200 SUCCESS")
        void givenSufficientBalance_thenReturnsSuccess() throws Exception {
            given(userService.deductBalance(any(), any())).willReturn(true);

            mockMvc.perform(post("/api/users/1/deduct-balance")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(Map.of("amount", 500))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"));
        }

        @Test @DisplayName("недостаточный баланс → 400 FAILED")
        void givenInsufficientBalance_thenReturnsFailed() throws Exception {
            given(userService.deductBalance(any(), any())).willReturn(false);

            mockMvc.perform(post("/api/users/1/deduct-balance")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(Map.of("amount", 99999))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("FAILED"));
        }
    }
}
