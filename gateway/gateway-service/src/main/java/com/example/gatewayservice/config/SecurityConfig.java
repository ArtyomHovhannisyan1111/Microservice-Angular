package com.example.gatewayservice.config;

import com.example.gatewayservice.filter.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import static jakarta.servlet.http.HttpServletResponse.SC_FORBIDDEN;
import static jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public FilterRegistrationBean<JwtFilter> jwtFilterRegistration(JwtFilter filter) {
        FilterRegistrationBean<JwtFilter> bean = new FilterRegistrationBean<>(filter);
        bean.setEnabled(false);
        return bean;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private static RequestMatcher uri(String... prefixes) {
        return req -> {
            String path = req.getRequestURI();
            for (String p : prefixes) {
                if (path.equals(p) || path.startsWith(p + "/")) return true;
            }
            return false;
        };
    }

    private static RequestMatcher uriMethod(String method, String... prefixes) {
        return req -> {
            if (!method.equalsIgnoreCase(req.getMethod())) return false;
            String path = req.getRequestURI();
            for (String p : prefixes) {
                if (path.equals(p) || path.startsWith(p + "/")) return true;
            }
            return false;
        };
    }

    @Bean
    public SecurityFilterChain configure(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(uri("/auth", "/api/auth", "/error")).permitAll()

                        .requestMatchers(uriMethod("GET", "/api/products")).permitAll()
                        .requestMatchers(uriMethod("POST", "/api/products")).hasRole("ADMIN")
                        .requestMatchers(uriMethod("PUT", "/api/products")).hasRole("ADMIN")
                        .requestMatchers(uriMethod("DELETE", "/api/products")).hasRole("ADMIN")

                        .requestMatchers(uri("/api/orders")).hasAnyRole("USER", "ADMIN")
                        .requestMatchers(uri("/api/notifications")).hasAnyRole("USER", "ADMIN")
                        .requestMatchers(uri("/api/users")).hasAnyRole("USER", "ADMIN")

                        .requestMatchers(uriMethod("GET", "/api/image")).permitAll()
                        .requestMatchers(uriMethod("POST", "/api/image")).hasRole("ADMIN")

                        .requestMatchers(uri("/api/analytics")).hasRole("ADMIN")

                        .requestMatchers(uri("/api/payment-methods")).hasAnyRole("USER", "ADMIN")

                        .requestMatchers(uri("/api/v1/balance")).hasAnyRole("USER", "ADMIN")

                        .anyRequest().hasRole("ADMIN")
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> {
                            res.setStatus(SC_UNAUTHORIZED);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("{\"error\":\"Необходима авторизация\"}");
                        })
                        .accessDeniedHandler((req, res, e) -> {
                            res.setStatus(SC_FORBIDDEN);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("{\"error\":\"Доступ запрещён. Войдите в систему заново.\"}");
                        })
                );

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
