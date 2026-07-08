package com.example.notificationservice.service;

import com.example.notificationservice.model.Notification;
import com.example.notificationservice.repository.NotificationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminService")
class AdminServiceTest {

    @Mock NotificationRepository notificationRepository;
    @Mock RestClient             restClient;

    @InjectMocks AdminService adminService;

    @Nested @DisplayName("getNotifications()")
    class GetNotifications {

        @Test @DisplayName("в репозитории есть записи → возвращает список из репозитория")
        void givenNotifications_whenGet_thenReturnsList() {
            Notification n1 = Notification.builder()
                    .id(1L).userId(5L).title("Заказ создан").message("msg")
                    .totalPrice(BigDecimal.TEN).isRead(false)
                    .createdAt(LocalDateTime.now()).build();
            Notification n2 = Notification.builder()
                    .id(2L).userId(7L).title("Заказ отменён").message("msg2")
                    .totalPrice(BigDecimal.ONE).isRead(true)
                    .createdAt(LocalDateTime.now().minusMinutes(5)).build();

            given(notificationRepository.findTop20ByOrderByCreatedAtDesc())
                    .willReturn(List.of(n1, n2));

            List<Notification> result = adminService.getNotifications();

            assertThat(result).hasSize(2)
                    .first().extracting(Notification::getTitle).isEqualTo("Заказ создан");
        }

        @Test @DisplayName("репозиторий пуст → пустой список")
        void givenEmpty_whenGet_thenEmpty() {
            given(notificationRepository.findTop20ByOrderByCreatedAtDesc()).willReturn(List.of());

            assertThat(adminService.getNotifications()).isEmpty();
        }
    }
}
