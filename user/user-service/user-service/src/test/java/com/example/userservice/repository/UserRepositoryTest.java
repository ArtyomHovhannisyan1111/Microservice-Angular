package com.example.userservice.repository;

import com.example.userservice.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@DisplayName("UserRepository")
class UserRepositoryTest {

    @Autowired TestEntityManager em;
    @Autowired UserRepository   repo;

    @BeforeEach
    void seed() {
        em.persistAndFlush(new User(null, "ivan", "ivan@mail.ru", "hash", "USER", BigDecimal.ZERO));
        em.persistAndFlush(new User(null, "admin", "admin@mail.ru", "hash", "ADMIN", new BigDecimal("500")));
        em.clear();
    }

    @Nested @DisplayName("findByUsername()")
    class FindByUsername {

        @Test @DisplayName("существующий username → Optional с пользователем")
        void givenExistingUsername_thenFound() {
            Optional<User> result = repo.findByUsername("ivan");
            assertThat(result).isPresent()
                    .get().extracting(User::getEmail).isEqualTo("ivan@mail.ru");
        }

        @Test @DisplayName("несуществующий username → Optional.empty")
        void givenUnknownUsername_thenEmpty() {
            assertThat(repo.findByUsername("ghost")).isEmpty();
        }
    }

    @Nested @DisplayName("findWithLockById()")
    class FindWithLock {

        @Test @DisplayName("существующий id → пользователь найден")
        void givenExistingId_thenFound() {
            User saved = repo.findByUsername("admin").get();
            Optional<User> result = repo.findWithLockById(saved.getId());
            assertThat(result).isPresent()
                    .get().extracting(User::getUsername).isEqualTo("admin");
        }

        @Test @DisplayName("несуществующий id → Optional.empty")
        void givenMissingId_thenEmpty() {
            assertThat(repo.findWithLockById(9999L)).isEmpty();
        }
    }
}
