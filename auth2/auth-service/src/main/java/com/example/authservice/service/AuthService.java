package com.example.authservice.service;

import com.example.authservice.config.JwtUtil2;
import com.example.authservice.dto.AuthRequest;
import com.example.authservice.dto.ForgotPasswordRequest;
import com.example.authservice.dto.ResetPasswordRequest;
import com.example.authservice.entity.PasswordResetToken;
import com.example.authservice.entity.UserAuth;
import com.example.authservice.entity.role.Role;
import com.example.authservice.repository.PasswordResetTokenRepository;
import com.example.authservice.repository.UserAuthRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAuthRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil2 jwtUtil;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final RestTemplate restTemplate;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${USER_SERVICE_URL:http://localhost:8092}")
    private String userServiceUrl;

    public ResponseEntity<String> register(AuthRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username is already taken!");
        }

        UserAuth user = new UserAuth();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER);

        userRepository.save(user);

        syncUserToUserService(request.getUsername(), request.getPassword());

        return ResponseEntity.ok("User registered successfully!");
    }

    private void syncUserToUserService(String username, String password) {
        try {
            Map<String, String> body = Map.of(
                    "username", username,
                    "password", password,
                    "email", username
            );
            restTemplate.postForObject(userServiceUrl + "/api/users/register", body, Object.class);
            log.info("User synced to user-service: {}", username);
        } catch (Exception e) {
            log.warn("Failed to sync user '{}' to user-service: {}", username, e.getMessage());
        }
    }

    public ResponseEntity<String> login(AuthRequest request) {
        UserAuth user = userRepository.findByUsername(request.getUsername())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body("Неверный логин или пароль");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name(), user.getId());
        return ResponseEntity.ok(token);
    }

    @Transactional
    public ResponseEntity<String> forgotPassword(ForgotPasswordRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isEmpty()) {
            return ResponseEntity.ok("Если такой email зарегистрирован, на него отправлено письмо");
        }

        tokenRepository.deleteByUsername(request.getUsername());

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(
                null, token, request.getUsername(), LocalDateTime.now().plusHours(24)
        );
        tokenRepository.save(resetToken);

        String resetLink = frontendUrl + "/auth/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(request.getUsername(), resetLink);

        return ResponseEntity.ok("Если такой email зарегистрирован, на него отправлено письмо");
    }

    @Transactional
    public ResponseEntity<String> resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = tokenRepository.findByToken(request.getToken())
                .orElse(null);

        if (resetToken == null) {
            return ResponseEntity.badRequest().body("Недействительная или устаревшая ссылка");
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(resetToken);
            return ResponseEntity.badRequest().body("Ссылка для восстановления пароля истекла");
        }

        UserAuth user = userRepository.findByUsername(resetToken.getUsername())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        tokenRepository.delete(resetToken);

        return ResponseEntity.ok("Пароль успешно изменён");
    }
}