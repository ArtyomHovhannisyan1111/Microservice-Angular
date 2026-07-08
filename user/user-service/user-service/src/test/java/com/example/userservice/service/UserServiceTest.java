package com.example.userservice.service;

import com.example.userservice.model.User;
import com.example.userservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService")
class UserServiceTest {

    @Mock UserRepository userRepository;
    @InjectMocks UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User(1L, "ivan", "ivan@mail.ru", "hashed", "USER", new BigDecimal("5000.00"));
    }

    // ── topUpBalance ──────────────────────────────────────────────────────────

    @Nested @DisplayName("topUpBalance()")
    class TopUp {

        @Test @DisplayName("корректная сумма → баланс увеличивается")
        void givenValidAmount_whenTopUp_thenBalanceIncreased() {
            given(userRepository.findWithLockById(1L)).willReturn(Optional.of(user));
            given(userRepository.save(any())).willAnswer(i -> i.getArgument(0));

            User result = userService.topUpBalance(1L, new BigDecimal("1000"));

            assertThat(result.getBalance()).isEqualByComparingTo("6000.00");
            then(userRepository).should().save(user);
        }

        @Test @DisplayName("сумма ≤ 0 → IllegalArgumentException, сохранения нет")
        void givenNegativeAmount_whenTopUp_thenThrows() {
            assertThatThrownBy(() -> userService.topUpBalance(1L, new BigDecimal("-100")))
                    .isInstanceOf(IllegalArgumentException.class);

            then(userRepository).shouldHaveNoInteractions();
        }
    }

    // ── deductBalance ─────────────────────────────────────────────────────────

    @Nested @DisplayName("deductBalance()")
    class Deduct {

        @Test @DisplayName("баланс достаточный → возвращает true, баланс уменьшается")
        void givenSufficientBalance_whenDeduct_thenReturnsTrueAndBalanceDecreased() {
            given(userRepository.findWithLockById(1L)).willReturn(Optional.of(user));
            given(userRepository.save(any())).willAnswer(i -> i.getArgument(0));

            boolean result = userService.deductBalance(1L, new BigDecimal("2000"));

            assertThat(result).isTrue();
            assertThat(user.getBalance()).isEqualByComparingTo("3000.00");
        }

        @Test @DisplayName("баланс недостаточный → возвращает false, баланс не меняется")
        void givenInsufficientBalance_whenDeduct_thenReturnsFalse() {
            given(userRepository.findWithLockById(1L)).willReturn(Optional.of(user));

            boolean result = userService.deductBalance(1L, new BigDecimal("9999"));

            assertThat(result).isFalse();
            assertThat(user.getBalance()).isEqualByComparingTo("5000.00");
            then(userRepository).should(never()).save(any());
        }

        @Test @DisplayName("пользователь не найден → RuntimeException")
        void givenMissingUser_whenDeduct_thenThrows() {
            given(userRepository.findWithLockById(99L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> userService.deductBalance(99L, new BigDecimal("100")))
                    .isInstanceOf(RuntimeException.class);
        }
    }

    // ── registeredUser ────────────────────────────────────────────────────────

    @Nested @DisplayName("registeredUser()")
    class Register {

        @Test @DisplayName("новый пользователь → сохраняется в БД")
        void givenNewUser_whenRegister_thenSaved() {
            given(userRepository.findByUsername("ivan")).willReturn(Optional.empty());
            given(userRepository.save(user)).willReturn(user);

            User result = userService.registeredUser(user);

            assertThat(result.getUsername()).isEqualTo("ivan");
            then(userRepository).should().save(user);
        }

        @Test @DisplayName("существующий пользователь → возвращает существующего, save не вызывается")
        void givenExistingUser_whenRegister_thenReturnsExisting() {
            given(userRepository.findByUsername("ivan")).willReturn(Optional.of(user));

            User result = userService.registeredUser(user);

            assertThat(result).isSameAs(user);
            then(userRepository).should(never()).save(any());
        }
    }
}
