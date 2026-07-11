package com.example.notificationservice.service;

import com.example.notificationservice.dto.ConfirmOrderRequest;
import com.example.notificationservice.dto.OrderEvent;
import com.example.notificationservice.model.Notification;
import com.example.notificationservice.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService")
class NotificationServiceTest {

    @Mock NotificationRepository notificationRepository;
    @Mock EmailService           emailService;

    @InjectMocks NotificationService notificationService;

    @Nested @DisplayName("consumeOrderEvent()")
    class ConsumeOrderEvent {

        @Test @DisplayName("входящее событие → уведомление сохраняется в БД")
        void givenOrderEvent_whenConsumed_thenNotificationSaved() {
            OrderEvent event = new OrderEvent(101L, 5L, new BigDecimal("9999"), "PENDING");

            notificationService.consumeOrderEvent(event);

            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            then(notificationRepository).should().save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getUserId()).isEqualTo(5L);
            assertThat(saved.getTitle()).contains("101");
            assertThat(saved.isRead()).isFalse();
        }
    }

    @Nested @DisplayName("confirmOrder()")
    class ConfirmOrder {

        private ConfirmOrderRequest request;

        @BeforeEach
        void setUp() {
            request = new ConfirmOrderRequest();
            request.setOrderId(200L);
            request.setUserId(10L);
            request.setUserEmail("user@mail.ru");
            request.setTotalPrice(new BigDecimal("5500"));
            request.setUserName("Иван");
        }

        @Test @DisplayName("с email → отправляет письмо и сохраняет уведомление")
        void givenRequestWithEmail_whenConfirm_thenEmailSentAndNotificationSaved() {
            notificationService.confirmOrder(request);

            then(emailService).should()
                    .sendOrderConfirmationEmail("user@mail.ru", 200L, new BigDecimal("5500"), "Иван");

            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            then(notificationRepository).should().save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getUserId()).isEqualTo(10L);
            assertThat(saved.getTitle()).isEqualTo("Заказ подтверждён");
            assertThat(saved.getMessage()).contains("200").contains("5500");
        }

        @Test @DisplayName("без email → письмо не отправляется, уведомление сохраняется")
        void givenRequestWithoutEmail_whenConfirm_thenOnlyNotificationSaved() {
            request.setUserEmail(null);

            notificationService.confirmOrder(request);

            then(emailService).shouldHaveNoInteractions();
            then(notificationRepository).should().save(any(Notification.class));
        }
    }

    @Nested @DisplayName("cancelOrder()")
    class CancelOrder {

        @Test @DisplayName("с email → письмо об отмене и уведомление в БД")
        void givenRequestWithEmail_whenCancel_thenEmailSentAndSaved() {
            ConfirmOrderRequest req = new ConfirmOrderRequest();
            req.setOrderId(300L);
            req.setUserId(20L);
            req.setUserEmail("buyer@shop.ru");
            req.setTotalPrice(new BigDecimal("2000"));
            req.setUserName("Мария");

            notificationService.cancelOrder(req);

            then(emailService).should()
                    .sendOrderCancellationEmail("buyer@shop.ru", 300L, new BigDecimal("2000"), "Мария");

            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            then(notificationRepository).should().save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getTitle()).isEqualTo("Заказ отменён");
            assertThat(saved.isRead()).isFalse();
        }
    }
}
