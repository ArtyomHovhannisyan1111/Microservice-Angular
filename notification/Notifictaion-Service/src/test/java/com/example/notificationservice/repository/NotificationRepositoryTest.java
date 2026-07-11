package com.example.notificationservice.repository;

import com.example.notificationservice.model.Notification;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@DisplayName("NotificationRepository")
class NotificationRepositoryTest {

    @Autowired TestEntityManager      em;
    @Autowired NotificationRepository repo;

    private Notification build(Long userId, String title, LocalDateTime time) {
        Notification n = Notification.builder()
                .userId(userId).title(title).message("msg")
                .totalPrice(BigDecimal.TEN).isRead(false).build();
        n.setCreatedAt(time);
        return n;
    }

    @BeforeEach
    void seed() {
        LocalDateTime base = LocalDateTime.now();
        em.persistAndFlush(build(1L, "Заказ создан",     base.minusMinutes(30)));
        em.persistAndFlush(build(1L, "Заказ подтверждён", base.minusMinutes(20)));
        em.persistAndFlush(build(1L, "Заказ отменён",    base.minusMinutes(10)));
        em.persistAndFlush(build(2L, "Заказ создан",     base.minusMinutes(5)));
        em.clear();
    }

    @Nested @DisplayName("findByUserIdOrderByCreatedAtDesc()")
    class ByUserId {

        @Test @DisplayName("userId=1 → 3 уведомления в порядке убывания по дате")
        void givenUser1_thenReturnsThreeDesc() {
            List<Notification> result = repo.findByUserIdOrderByCreatedAtDesc(1L);

            assertThat(result).hasSize(3);
            assertThat(result.get(0).getTitle()).isEqualTo("Заказ отменён");
            assertThat(result.get(2).getTitle()).isEqualTo("Заказ создан");
        }

        @Test @DisplayName("userId=2 → 1 уведомление")
        void givenUser2_thenReturnsOne() {
            assertThat(repo.findByUserIdOrderByCreatedAtDesc(2L)).hasSize(1);
        }

        @Test @DisplayName("несуществующий userId → пустой список")
        void givenUnknownUser_thenEmpty() {
            assertThat(repo.findByUserIdOrderByCreatedAtDesc(99L)).isEmpty();
        }
    }

    @Nested @DisplayName("findTop20ByOrderByCreatedAtDesc()")
    class Top20 {

        @Test @DisplayName("4 записи → все 4 возвращаются в порядке убывания")
        void givenFourNotifications_thenReturnsAllDesc() {
            List<Notification> result = repo.findTop20ByOrderByCreatedAtDesc();

            assertThat(result).hasSize(4);
            assertThat(result.get(0).getUserId()).isEqualTo(2L);
        }
    }
}
