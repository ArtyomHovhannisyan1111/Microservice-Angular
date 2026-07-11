package com.example.authservice.service;

import com.example.authservice.config.JwtUtil2;
import com.example.authservice.dto.AuthRequest;
import com.example.authservice.entity.UserAuth;
import com.example.authservice.entity.role.Role;
import com.example.authservice.repository.PasswordResetTokenRepository;
import com.example.authservice.repository.UserAuthRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService")
class AuthServiceTest {

    @Mock UserAuthRepository           userRepository;
    @Mock PasswordEncoder              passwordEncoder;
    @Mock JwtUtil2                     jwtUtil;
    @Mock PasswordResetTokenRepository tokenRepository;
    @Mock EmailService                 emailService;

    @InjectMocks AuthService authService;

    private AuthRequest validRequest;
    private UserAuth    storedUser;

    @BeforeEach
    void setUp() {
        validRequest = new AuthRequest("ivan", "secret123");
        storedUser   = new UserAuth(1L, "ivan", "$2a$10$hashed", Role.USER);
    }

    @Nested @DisplayName("register()")
    class Register {

        @Test @DisplayName("новый пользователь → 200 OK, сохраняется с хэшированным паролем")
        void givenNewUser_whenRegister_thenSavedAndReturns200() {
            given(userRepository.findByUsername("ivan")).willReturn(Optional.empty());
            given(passwordEncoder.encode("secret123")).willReturn("$2a$10$hashed");
            given(userRepository.save(any())).willReturn(storedUser);

            ResponseEntity<String> response = authService.register(validRequest);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).contains("successfully");
            then(passwordEncoder).should().encode("secret123");
            then(userRepository).should().save(any(UserAuth.class));
        }

        @Test @DisplayName("username занят → 400 Bad Request, save не вызывается")
        void givenExistingUsername_whenRegister_thenReturns400() {
            given(userRepository.findByUsername("ivan")).willReturn(Optional.of(storedUser));

            ResponseEntity<String> response = authService.register(validRequest);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).contains("already taken");
            then(userRepository).should(never()).save(any());
        }
    }

    @Nested @DisplayName("login()")
    class Login {

        @Test @DisplayName("верные учётные данные → 200 OK с JWT-токеном")
        void givenCorrectCredentials_whenLogin_thenReturnsToken() {
            given(userRepository.findByUsername("ivan")).willReturn(Optional.of(storedUser));
            given(passwordEncoder.matches("secret123", "$2a$10$hashed")).willReturn(true);
            given(jwtUtil.generateToken("ivan", "USER", 1L)).willReturn("eyJhbGci..");

            ResponseEntity<String> response = authService.login(validRequest);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEqualTo("eyJhbGci..");
        }

        @Test @DisplayName("пользователь не найден → 401 Unauthorized")
        void givenUnknownUser_whenLogin_thenReturns401() {
            given(userRepository.findByUsername("ivan")).willReturn(Optional.empty());

            ResponseEntity<String> response = authService.login(validRequest);

            assertThat(response.getStatusCode().value()).isEqualTo(401);
        }

        @Test @DisplayName("неверный пароль → 401 Unauthorized")
        void givenWrongPassword_whenLogin_thenReturns401() {
            given(userRepository.findByUsername("ivan")).willReturn(Optional.of(storedUser));
            given(passwordEncoder.matches(anyString(), anyString())).willReturn(false);

            ResponseEntity<String> response = authService.login(validRequest);

            assertThat(response.getStatusCode().value()).isEqualTo(401);
            then(jwtUtil).shouldHaveNoInteractions();
        }
    }
}
