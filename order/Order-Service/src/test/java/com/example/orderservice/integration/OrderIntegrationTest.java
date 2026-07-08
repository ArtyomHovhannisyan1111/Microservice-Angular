package com.example.orderservice.integration;

import com.example.orderservice.Dto.OrderRequest;
import com.example.orderservice.Repository.OrderRepository;
import com.example.orderservice.model.Order;
import com.example.orderservice.model.OrderStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-End интеграционный тест внутри order-service.
 *
 * Что поднимается:
 *   • PostgreSQL в Docker (Testcontainers)
 *   • Kafka в Docker (Testcontainers)
 *   • Полный Spring Boot ApplicationContext (@SpringBootTest)
 *   • Feign-клиенты замокированы на уровне бинов (см. TestConfig)
 *
 * Сценарий: POST /api/orders → заказ сохранён в БД → событие попало в Kafka-топик.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@DisplayName("OrderService — E2E Integration")
class OrderIntegrationTest {

    // ─── Контейнеры (static = один на весь класс, переиспользуются между тестами) ──

    @Container
    static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"))
                    .withDatabaseName("orders_test")
                    .withUsername("test")
                    .withPassword("test");

    @Container
    static final KafkaContainer kafka =
            new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.1"));

    // ─── Подключаем Testcontainers к Spring-контексту ─────────────────────────

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        // PostgreSQL
        registry.add("spring.datasource.url",      postgres::getJdbcUrl);
        registry.add("spring.datasource.username",  postgres::getUsername);
        registry.add("spring.datasource.password",  postgres::getPassword);
        // Kafka
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }

    // ─── Бины ─────────────────────────────────────────────────────────────────

    @Autowired MockMvc        mockMvc;
    @Autowired ObjectMapper   objectMapper;
    @Autowired OrderRepository orderRepository;

    private KafkaConsumer<String, String> testConsumer;

    // ─── Жизненный цикл ──────────────────────────────────────────────────────

    @BeforeEach
    void setUpKafkaConsumer() {
        testConsumer = new KafkaConsumer<>(Map.of(
                "bootstrap.servers",  kafka.getBootstrapServers(),
                "group.id",           "test-group-" + UUID.randomUUID(),
                "auto.offset.reset",  "earliest",
                "key.deserializer",   StringDeserializer.class.getName(),
                "value.deserializer", StringDeserializer.class.getName()
        ));
        testConsumer.subscribe(List.of("order-events"));
    }

    @AfterEach
    void tearDown() {
        testConsumer.close();
        orderRepository.deleteAll();
    }

    // ─── Тест ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/orders → 201, заказ в PostgreSQL, событие в Kafka")
    void givenValidRequest_whenCreateOrder_thenPersistedAndEventPublished() throws Exception {
        // ── Arrange ──────────────────────────────────────────────────────────
        OrderRequest request = new OrderRequest();
        request.setRequestId(UUID.randomUUID().toString());
        request.setUserId(1);
        request.setProductId(1);
        request.setQuantity(2);
        request.setUserEmail("test@integration.com");
        request.setUserName("Integration User");

        // ── Act ───────────────────────────────────────────────────────────────
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                // ── Assert: HTTP-ответ ────────────────────────────────────────
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("pending"))
                .andExpect(jsonPath("$.userId").value(1));

        // ── Assert: запись в PostgreSQL ───────────────────────────────────────
        List<Order> saved = orderRepository.findByUserId(1);
        assertThat(saved).hasSize(1);
        assertThat(saved.get(0).getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(saved.get(0).getQuantity()).isEqualTo(2);

        // ── Assert: событие в Kafka-топике ────────────────────────────────────
        List<ConsumerRecord<String, String>> records = pollUntil(testConsumer, 1, Duration.ofSeconds(10));
        assertThat(records).hasSize(1);

        String eventJson = records.get(0).value();
        assertThat(eventJson).contains("\"userId\":1");
        assertThat(eventJson).contains("\"status\"");
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Опрашивает Kafka до тех пор, пока не наберёт {@code atLeast} записей
     * или не истечёт {@code timeout}.
     */
    private static List<ConsumerRecord<String, String>> pollUntil(
            KafkaConsumer<String, String> consumer, int atLeast, Duration timeout) {

        List<ConsumerRecord<String, String>> all = new ArrayList<>();
        long deadline = System.currentTimeMillis() + timeout.toMillis();

        while (System.currentTimeMillis() < deadline && all.size() < atLeast) {
            ConsumerRecords<String, String> batch = consumer.poll(Duration.ofMillis(300));
            batch.forEach(all::add);
        }
        return all;
    }
}
