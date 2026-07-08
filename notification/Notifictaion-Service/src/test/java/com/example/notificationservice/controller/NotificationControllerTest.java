package com.example.notificationservice.controller;

import com.example.notificationservice.dto.ConfirmOrderRequest;
import com.example.notificationservice.model.Notification;
import com.example.notificationservice.repository.NotificationRepository;
import com.example.notificationservice.service.NotificationService;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(NotificationController.class)
@DisplayName("NotificationController")
class NotificationControllerTest {

    @Autowired MockMvc      mockMvc;
    @Autowired ObjectMapper mapper;
    @MockBean  NotificationRepository notificationRepository;
    @MockBean  NotificationService    notificationService;

    private Notification notification(Long id, Long userId) {
        return Notification.builder()
                .id(id).userId(userId)
                .title("Заказ создан").message("Ваш заказ #1")
                .totalPrice(new BigDecimal("1500")).isRead(false)
                .createdAt(LocalDateTime.now()).build();
    }

    @Nested @DisplayName("GET /api/notifications/user/{userId}")
    class GetByUser {

        @Test @DisplayName("userId с уведомлениями → 200 со списком")
        void givenUserId_thenReturns200() throws Exception {
            given(notificationRepository.findByUserIdOrderByCreatedAtDesc(5L))
                    .willReturn(List.of(notification(1L, 5L), notification(2L, 5L)));

            mockMvc.perform(get("/api/notifications/user/5"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].userId").value(5));
        }

        @Test @DisplayName("userId без уведомлений → 200 с пустым списком")
        void givenUserWithNone_thenReturnsEmpty() throws Exception {
            given(notificationRepository.findByUserIdOrderByCreatedAtDesc(99L))
                    .willReturn(List.of());

            mockMvc.perform(get("/api/notifications/user/99"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
        }
    }

    @Nested @DisplayName("POST /api/notifications/{id}/read")
    class MarkRead {

        @Test @DisplayName("существующее уведомление → 200, isRead устанавливается в true")
        void givenExistingId_whenRead_thenReturns200() throws Exception {
            Notification n = notification(1L, 5L);
            given(notificationRepository.findById(1L)).willReturn(Optional.of(n));
            given(notificationRepository.save(any())).willReturn(n);

            mockMvc.perform(post("/api/notifications/1/read"))
                    .andExpect(status().isOk());

            then(notificationRepository).should().save(any());
        }

        @Test @DisplayName("несуществующее id → 200, save не вызывается")
        void givenMissingId_whenRead_thenReturns200WithoutSave() throws Exception {
            given(notificationRepository.findById(99L)).willReturn(Optional.empty());

            mockMvc.perform(post("/api/notifications/99/read"))
                    .andExpect(status().isOk());

            then(notificationRepository).should(org.mockito.Mockito.never()).save(any());
        }
    }

    @Nested @DisplayName("POST /api/notifications/confirm-order")
    class ConfirmOrder {

        @Test @DisplayName("запрос подтверждения → 200, NotificationService.confirmOrder вызван")
        void givenRequest_whenConfirm_thenReturns200() throws Exception {
            ConfirmOrderRequest req = new ConfirmOrderRequest();
            req.setOrderId(10L);
            req.setUserId(5L);
            req.setUserEmail("u@mail.ru");
            req.setTotalPrice(new BigDecimal("2000"));
            req.setUserName("Ivan");

            mockMvc.perform(post("/api/notifications/confirm-order")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(req)))
                    .andExpect(status().isOk());

            then(notificationService).should().confirmOrder(any());
        }
    }

    @Nested @DisplayName("POST /api/notifications/cancel-order")
    class CancelOrder {

        @Test @DisplayName("запрос отмены → 200, NotificationService.cancelOrder вызван")
        void givenRequest_whenCancel_thenReturns200() throws Exception {
            ConfirmOrderRequest req = new ConfirmOrderRequest();
            req.setOrderId(10L);
            req.setUserId(5L);
            req.setUserEmail("u@mail.ru");
            req.setTotalPrice(new BigDecimal("1000"));
            req.setUserName("Ivan");

            mockMvc.perform(post("/api/notifications/cancel-order")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(req)))
                    .andExpect(status().isOk());

            then(notificationService).should().cancelOrder(any());
        }
    }
}
