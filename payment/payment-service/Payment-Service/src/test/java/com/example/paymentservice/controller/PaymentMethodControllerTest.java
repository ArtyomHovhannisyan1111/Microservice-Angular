package com.example.paymentservice.controller;

import com.example.paymentservice.dto.PaymentMethodRequest;
import com.example.paymentservice.dto.PaymentMethodResponse;
import com.example.paymentservice.service.PaymentMethodService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PaymentMethodController.class)
@Import(com.example.paymentservice.Exception.GlobalExceptionHandler.class)
@DisplayName("PaymentMethodController")
class PaymentMethodControllerTest {

    @Autowired MockMvc     mockMvc;
    @Autowired ObjectMapper mapper;
    @MockBean  PaymentMethodService service;

    private PaymentMethodRequest validRequest() {
        return PaymentMethodRequest.builder()
                .userId(1L).type("CARD").providerName("Visa")
                .rawNumber("4111111111111111").cardholderName("Ivan").cvv("123")
                .build();
    }

    private PaymentMethodResponse sampleResponse() {
        return PaymentMethodResponse.builder()
                .id(10L).userId(1L).type("CARD").providerName("Visa")
                .maskedNumber("**** 1111").cardholderName("Ivan").isActive(true)
                .build();
    }

    @Nested @DisplayName("POST /api/payment-methods")
    class Create {

        @Test @DisplayName("валидный запрос → 201 Created")
        void givenValid_whenCreate_thenReturns201() throws Exception {
            given(service.save(any())).willReturn(sampleResponse());

            mockMvc.perform(post("/api/payment-methods")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(validRequest())))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(10))
                    .andExpect(jsonPath("$.maskedNumber").value("**** 1111"));
        }

        @Test @DisplayName("null userId → 400 Bad Request")
        void givenNullUserId_whenCreate_thenReturns400() throws Exception {
            PaymentMethodRequest bad = validRequest();
            bad.setUserId(null);

            mockMvc.perform(post("/api/payment-methods")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(bad)))
                    .andExpect(status().isBadRequest());
        }

        @Test @DisplayName("null providerName → 400 Bad Request")
        void givenNullProvider_whenCreate_thenReturns400() throws Exception {
            PaymentMethodRequest bad = validRequest();
            bad.setProviderName(null);

            mockMvc.perform(post("/api/payment-methods")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(bad)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested @DisplayName("GET /api/payment-methods/user/{userId}")
    class GetByUser {

        @Test @DisplayName("userId с картами → 200 со списком")
        void givenUserId_thenReturns200WithList() throws Exception {
            given(service.getMethodsByUserId(1L)).willReturn(List.of(sampleResponse()));

            mockMvc.perform(get("/api/payment-methods/user/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].type").value("CARD"));
        }

        @Test @DisplayName("userId без карт → 200 с пустым списком")
        void givenUserWithNoCards_thenReturnsEmptyList() throws Exception {
            given(service.getMethodsByUserId(99L)).willReturn(List.of());

            mockMvc.perform(get("/api/payment-methods/user/99"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
        }
    }
}
