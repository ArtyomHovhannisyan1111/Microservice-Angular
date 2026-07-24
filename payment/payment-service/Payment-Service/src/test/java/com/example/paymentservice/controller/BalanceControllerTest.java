package com.example.paymentservice.controller;

import com.example.paymentservice.dto.TopUpRequest;
import com.example.paymentservice.dto.TopUpResponse;
import com.example.paymentservice.service.BalanceService;
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

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BalanceController.class)
@Import(com.example.paymentservice.Exception.GlobalExceptionHandler.class)
@DisplayName("BalanceController")
class BalanceControllerTest {

    @Autowired MockMvc     mockMvc;
    @Autowired ObjectMapper mapper;
    @MockBean  BalanceService balanceService;

    @Nested @DisplayName("POST /api/v1/balance/deposit")
    class Deposit {

        @Test @DisplayName("валидный запрос → 200 с TopUpResponse")
        void givenValidRequest_whenDeposit_thenReturns200() throws Exception {
            TopUpRequest req = new TopUpRequest();
            req.setPaymentMethodId(10L);
            req.setAmount(new BigDecimal("500"));

            TopUpResponse resp = new TopUpResponse();
            resp.setCardId(10L);
            resp.setMaskedPan("**** 1234");
            resp.setAmount(new BigDecimal("500"));
            resp.setBrand("Visa");

            given(balanceService.depositToCard(anyLong(), any())).willReturn(resp);

            mockMvc.perform(post("/api/v1/balance/deposit")
                            .header("X-User-Id", "42")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.maskedPan").value("**** 1234"))
                    .andExpect(jsonPath("$.brand").value("Visa"));
        }

        @Test @DisplayName("null amount → 400 Bad Request")
        void givenNullAmount_whenDeposit_thenReturns400() throws Exception {
            TopUpRequest bad = new TopUpRequest();
            bad.setPaymentMethodId(10L);

            mockMvc.perform(post("/api/v1/balance/deposit")
                            .header("X-User-Id", "42")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(bad)))
                    .andExpect(status().isBadRequest());
        }
    }
}
