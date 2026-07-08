package com.example.authservice.repository;

import com.example.authservice.entity.UserAuth;
import com.example.authservice.entity.role.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@DisplayName("UserAuthRepository")
class UserAuthRepositoryTest {

    @Autowired TestEntityManager  em;
    @Autowired UserAuthRepository repo;

    @BeforeEach
    void seed() {
        em.persistAndFlush(new UserAuth(null, "ivan", "$2a$10$hash1", Role.USER));
        em.persistAndFlush(new UserAuth(null, "admin", "$2a$10$hash2", Role.ADMIN));
        em.clear();
    }

    @Nested @DisplayName("findByUsername()")
    class FindByUsername {

        @Test @DisplayName("существующий username → Optional с сущностью")
        void givenExistingUsername_thenFound() {
            Optional<UserAuth> result = repo.findByUsername("ivan");

            assertThat(result).isPresent()
                    .get().satisfies(u -> {
                        assertThat(u.getUsername()).isEqualTo("ivan");
                        assertThat(u.getRole()).isEqualTo(Role.USER);
                    });
        }

        @Test @DisplayName("несуществующий username → Optional.empty")
        void givenUnknownUsername_thenEmpty() {
            assertThat(repo.findByUsername("ghost")).isEmpty();
        }

        @Test @DisplayName("admin → роль ADMIN")
        void givenAdminUsername_thenRoleIsAdmin() {
            Optional<UserAuth> result = repo.findByUsername("admin");
            assertThat(result).isPresent()
                    .get().extracting(UserAuth::getRole).isEqualTo(Role.ADMIN);
        }
    }
}
