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

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@DisplayName("OrderService — E2E Integration")
class OrderIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"))
                    .withDatabaseName("orders_test")
                    .withUsername("test")
                    .withPassword("test");

    @Container
    static final KafkaContainer kafka =
            new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.1"));

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",      postgres::getJdbcUrl);
        registry.add("spring.datasource.username",  postgres::getUsername);
        registry.add("spring.datasource.password",  postgres::getPassword);
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }

    @Autowired MockMvc        mockMvc;
    @Autowired ObjectMapper   objectMapper;
    @Autowired OrderRepository orderRepository;

    private KafkaConsumer<String, String> testConsumer;

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

    @Test
    @DisplayName("POST /api/orders → 201, заказ в PostgreSQL, событие в Kafka")
    void givenValidRequest_whenCreateOrder_thenPersistedAndEventPublished() throws Exception {
        OrderRequest request = new OrderRequest();
        request.setRequestId(UUID.randomUUID().toString());
        request.setUserId(1);
        request.setProductId(1);
        request.setQuantity(2);
        request.setUserEmail("test@integration.com");
        request.setUserName("Integration User");

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("pending"))
                .andExpect(jsonPath("$.userId").value(1));

        List<Order> saved = orderRepository.findByUserId(1);
        assertThat(saved).hasSize(1);
        assertThat(saved.get(0).getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(saved.get(0).getQuantity()).isEqualTo(2);

        List<ConsumerRecord<String, String>> records = pollUntil(testConsumer, 1, Duration.ofSeconds(10));
        assertThat(records).hasSize(1);

        String eventJson = records.get(0).value();
        assertThat(eventJson).contains("\"userId\":1");
        assertThat(eventJson).contains("\"status\"");
    }

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
