package com.example.authservice.service;

import com.example.authservice.config.AuthConfig;
import com.example.authservice.config.JwtUtilAuth;
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
    private final UserAuthRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtUtilAuth jwt;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService email;
    private final RestTemplate rest;
    private final AuthConfig conf;

    public ResponseEntity<String> register(AuthRequest req) {
        if (userRepo.findByUsername(req.getUsername()).isPresent())
            return ResponseEntity.badRequest().body("Taken");

        UserAuth user = new UserAuth();
        user.setUsername(req.getUsername());
        user.setPassword(encoder.encode(req.getPassword()));
        user.setRole(Role.USER);

        userRepo.save(user);
        sync(req.getUsername(), req.getPassword());
        return ResponseEntity.ok("Success");
    }
    public ResponseEntity<String> login(AuthRequest req) {
        UserAuth user = userRepo.findByUsername(req.getUsername()).orElse(null);
        if (user == null || !encoder.matches(req.getPassword(), user.getPassword()))
            return ResponseEntity.status(401).body("Invalid");
        return ResponseEntity.ok(jwt.generateToken(user.getUsername(), user.getRole().name(), user.getId()));
    }

    @Transactional
    public ResponseEntity<String> forgotPassword(ForgotPasswordRequest req) {
        userRepo.findByUsername(req.getUsername()).ifPresent(u -> {
            tokenRepository.deleteByUsername(u.getUsername());
            String token = UUID.randomUUID().toString();
            tokenRepository .save(new PasswordResetToken(null, token, u.getUsername(), LocalDateTime.now().plusHours(24)));
            email.sendPasswordResetEmail(u.getUsername(), conf.getFrontendUrl() + "/reset?token=" + token);
        });
        return ResponseEntity.ok("Email sent if exists");
    }

    @Transactional
    public ResponseEntity<String> resetPassword(ResetPasswordRequest req) {
        PasswordResetToken token = tokenRepository.findByToken(req.getToken()).filter(x -> x.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new RuntimeException("Invalid/Expired"));
        UserAuth user = userRepo.findByUsername(token.getUsername()).orElseThrow();
        user.setPassword(encoder.encode(req.getNewPassword()));
        userRepo.save(user);
        tokenRepository.delete(token);
        return ResponseEntity.ok("Changed");
    }

    private void sync(String u, String p) {
        try { rest.postForObject(conf.getUserServiceUrl() + "/api/users/register", Map.of("username", u, "password", p), Object.class); }
        catch (Exception e) { log.warn("Sync failed"); }
    }
}