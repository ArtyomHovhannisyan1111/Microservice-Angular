package com.example.gatewayservice.filter;

import com.example.gatewayservice.config.JwtUtil;
import com.example.gatewayservice.util.RoleUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String header = req.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(req, res);
            return;
        }

        try {
            String token = header.substring(7);
            Claims claims = jwtUtil.getClaims(token);
            String username = claims.getSubject();
            String role = RoleUtil.normalize(claims.get("role", String.class));

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                var auth = new UsernamePasswordAuthenticationToken(
                        username, null, List.of(new SimpleGrantedAuthority(role))
                );
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }

            Object userId = claims.get("userId");
            if (userId != null) {
                req = new HeaderEnrichingRequest(req, "X-User-Id", userId.toString());
            }
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
        }
        chain.doFilter(req, res);
    }

    private static class HeaderEnrichingRequest extends HttpServletRequestWrapper {
        private final String name;
        private final String value;

        HeaderEnrichingRequest(HttpServletRequest request, String name, String value) {
            super(request);
            this.name = name;
            this.value = value;
        }

        @Override
        public String getHeader(String n) {
            return name.equalsIgnoreCase(n) ? value : super.getHeader(n);
        }

        @Override
        public Enumeration<String> getHeaders(String n) {
            return name.equalsIgnoreCase(n)
                    ? Collections.enumeration(List.of(value))
                    : super.getHeaders(n);
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            var names = new ArrayList<>(Collections.list(super.getHeaderNames()));
            if (names.stream().noneMatch(name::equalsIgnoreCase)) names.add(name);
            return Collections.enumeration(names);
        }
    }
}