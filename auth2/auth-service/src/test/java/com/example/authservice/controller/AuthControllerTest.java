package com.example.authservice.controller;

import com.example.authservice.dto.AuthRequest;
import com.example.authservice.endpoint.AuthController;
import com.example.authservice.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(com.example.authservice.config.AuthConfig.class)
@DisplayName("AuthController")
class AuthControllerTest {

    @Autowired MockMvc     mockMvc;
    @Autowired ObjectMapper mapper;
    @MockBean  AuthService authService;

    @Nested @DisplayName("POST /auth/register")
    class Register {

        @Test @DisplayName("новый пользователь → 200 OK с сообщением")
        void givenNewUser_whenRegister_thenReturns200() throws Exception {
            AuthRequest req = new AuthRequest("ivan", "pass123");

            given(authService.register(any()))
                    .willReturn(ResponseEntity.ok("User registered successfully"));

            mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(content().string("User registered successfully"));
        }

        @Test @DisplayName("дубликат username → 400 Bad Request")
        void givenDuplicate_whenRegister_thenReturns400() throws Exception {
            AuthRequest req = new AuthRequest("ivan", "pass123");

            given(authService.register(any()))
                    .willReturn(ResponseEntity.badRequest().body("Username already taken"));

            mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Username already taken"));
        }
    }

    @Nested @DisplayName("POST /auth/login")
    class Login {

        @Test @DisplayName("верные данные → 200 OK с JWT")
        void givenValidCredentials_whenLogin_thenReturnsToken() throws Exception {
            AuthRequest req = new AuthRequest("ivan", "pass123");

            given(authService.login(any()))
                    .willReturn(ResponseEntity.ok("eyJhbGci.."));

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(content().string("eyJhbGci.."));
        }

        @Test @DisplayName("неверные данные → 401")
        void givenWrongCredentials_whenLogin_thenReturns401() throws Exception {
            AuthRequest req = new AuthRequest("ivan", "wrong");

            given(authService.login(any()))
                    .willReturn(ResponseEntity.status(401).body("Invalid credentials"));

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(req)))
                    .andExpect(status().isUnauthorized());
        }
    }
}
