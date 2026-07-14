package com.example.authservice.config;

import com.example.authservice.entity.UserAuth;
import com.example.authservice.entity.role.Role;
import com.example.authservice.repository.UserAuthRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserAuthRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.username:admin@admin.com}")
    private String adminUsername;

    @Value("${admin.password:admin123}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername(adminUsername).isEmpty()) {
            UserAuth admin = new UserAuth();
            admin.setUsername(adminUsername);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
            log.info("Admin user created: {}", adminUsername);
        }
    }
}