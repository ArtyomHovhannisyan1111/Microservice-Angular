package com.example.analyticsservice.consumer;

import com.example.analyticsservice.dto.OrderItem;
import com.example.analyticsservice.dto.OrderPlacedEvent;
import com.example.analyticsservice.entity.ProductStatistics;
import com.example.analyticsservice.repository.ProductStatisticsRepository;
import com.example.analyticsservice.service.AnalyticsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@SpringBootTest
@ActiveProfiles("test")
@EmbeddedKafka(
    partitions      = 1,
    topics          = { "order-placed-topic" },
    brokerProperties = {
        "listeners=PLAINTEXT://localhost:${random.int[10000,20000]}",
        "port=0"
    }
)
@TestPropertySource(properties = {
    "spring.kafka.consumer.auto-offset-reset=earliest",
    "spring.kafka.consumer.group-id=test-analytics-group",
    "spring.datasource.url=jdbc:h2:mem:analyticstest;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.liquibase.enabled=false"
})
@DirtiesContext
@DisplayName("OrderEventConsumer")
class OrderEventConsumerTest {

    @Autowired KafkaTemplate<String, String>    kafkaTemplate;
    @Autowired ProductStatisticsRepository      statsRepository;
    @Autowired ObjectMapper                     objectMapper;

    private static final String TOPIC = "order-placed-topic";

    @AfterEach
    void cleanDb() {
        statsRepository.deleteAll();
    }

    @Nested
    @DisplayName("onOrderPlaced()")
    class OnOrderPlaced {

        @Test
        @DisplayName("новый товар → создаётся запись ProductStatistics")
        void givenNewProduct_whenEventConsumed_thenStatisticsCreated() throws Exception {
            OrderPlacedEvent event = new OrderPlacedEvent(
                    1L,
                    List.of(new OrderItem(100L, "Ноутбук", 2, 50_000.0))
            );
            String json = objectMapper.writeValueAsString(event);

            kafkaTemplate.send(TOPIC, json);

            await().atMost(10, TimeUnit.SECONDS)
                   .pollInterval(200, TimeUnit.MILLISECONDS)
                   .untilAsserted(() -> {
                       Optional<ProductStatistics> stats = statsRepository.findById(100L);

                       assertThat(stats).isPresent();
                       assertThat(stats.get().getProductName()).isEqualTo("Ноутбук");
                       assertThat(stats.get().getTotalSoldQuantity()).isEqualTo(2);
                       assertThat(stats.get().getTotalRevenue()).isEqualTo(100_000.0);
                   });
        }

        @Test
        @DisplayName("повторное событие по тому же товару → счётчики накапливаются")
        void givenExistingProduct_whenSecondEventConsumed_thenCountersAccumulate() throws Exception {
            statsRepository.save(ProductStatistics.builder()
                    .productId(200L)
                    .productName("Мышь")
                    .totalSoldQuantity(5)
                    .totalRevenue(5_000.0)
                    .build());

            OrderPlacedEvent event = new OrderPlacedEvent(
                    2L,
                    List.of(new OrderItem(200L, "Мышь", 3, 1_000.0))
            );

            kafkaTemplate.send(TOPIC, objectMapper.writeValueAsString(event));

            await().atMost(10, TimeUnit.SECONDS)
                   .pollInterval(200, TimeUnit.MILLISECONDS)
                   .untilAsserted(() -> {
                       ProductStatistics stats = statsRepository.findById(200L).orElseThrow();

                       assertThat(stats.getTotalSoldQuantity()).isEqualTo(8);
                       assertThat(stats.getTotalRevenue()).isEqualTo(8_000.0);
                   });
        }

        @Test
        @DisplayName("событие с несколькими позициями → все товары обновлены")
        void givenMultipleItems_whenEventConsumed_thenAllStatisticsUpdated() throws Exception {
            OrderPlacedEvent event = new OrderPlacedEvent(
                    3L,
                    List.of(
                        new OrderItem(301L, "Монитор",   1, 30_000.0),
                        new OrderItem(302L, "Клавиатура", 2,  3_000.0)
                    )
            );

            kafkaTemplate.send(TOPIC, objectMapper.writeValueAsString(event));

            await().atMost(10, TimeUnit.SECONDS)
                   .pollInterval(200, TimeUnit.MILLISECONDS)
                   .untilAsserted(() -> {
                       assertThat(statsRepository.findById(301L))
                               .isPresent()
                               .hasValueSatisfying(s -> {
                                   assertThat(s.getTotalSoldQuantity()).isEqualTo(1);
                                   assertThat(s.getTotalRevenue()).isEqualTo(30_000.0);
                               });

                       assertThat(statsRepository.findById(302L))
                               .isPresent()
                               .hasValueSatisfying(s -> {
                                   assertThat(s.getTotalSoldQuantity()).isEqualTo(2);
                                   assertThat(s.getTotalRevenue()).isEqualTo(6_000.0);
                               });
                   });
        }
    }
}
