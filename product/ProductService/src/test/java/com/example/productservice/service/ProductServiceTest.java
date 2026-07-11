package com.example.productservice.service;

import com.example.productservice.dto.ProductRequest;
import com.example.productservice.exception.InsufficientStockException;
import com.example.productservice.exception.ProductAlreadyExistsException;
import com.example.productservice.exception.ProductNotFoundException;
import com.example.productservice.model.Product;
import com.example.productservice.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProductService")
class ProductServiceTest {

    @Mock ProductRepository              productRepository;
    @Mock KafkaTemplate<Integer, Object> kafkaTemplate;

    @InjectMocks ProductService productService;

    private Product laptop;

    @BeforeEach
    void setUp() {
        laptop = Product.builder()
                .id(1).name("Ноутбук").price(new BigDecimal("80000"))
                .quantity(10).category("Электроника").build();
    }

    @Nested @DisplayName("saveProduct()")
    class SaveProduct {

        @Test @DisplayName("новый товар → сохраняется и публикует событие в Kafka")
        void givenUniqueProduct_whenSave_thenSavedAndEventPublished() {
            ProductRequest req = ProductRequest.builder()
                    .name("Ноутбук").price(new BigDecimal("80000")).quantity(10).build();

            given(productRepository.existsByNameIgnoreCase("Ноутбук")).willReturn(false);
            given(productRepository.save(any())).willReturn(laptop);

            Product result = productService.saveProduct(req);

            assertThat(result.getName()).isEqualTo("Ноутбук");
            then(kafkaTemplate).should().send(anyString(), eq(1), any());
        }

        @Test @DisplayName("дублирующееся имя → ProductAlreadyExistsException, в БД ничего не сохраняется")
        void givenDuplicateName_whenSave_thenThrows() {
            ProductRequest req = ProductRequest.builder()
                    .name("Ноутбук").price(new BigDecimal("80000")).quantity(5).build();

            given(productRepository.existsByNameIgnoreCase(anyString())).willReturn(true);

            assertThatThrownBy(() -> productService.saveProduct(req))
                    .isInstanceOf(ProductAlreadyExistsException.class);

            then(productRepository).should(never()).save(any());
            then(kafkaTemplate).shouldHaveNoInteractions();
        }
    }

    @Nested @DisplayName("decreaseStock()")
    class DecreaseStock {

        @Test @DisplayName("достаточный остаток → остаток уменьшается")
        void givenSufficientStock_whenDecrease_thenStockReduced() {
            given(productRepository.findById(1)).willReturn(Optional.of(laptop));
            given(productRepository.save(any())).willAnswer(i -> i.getArgument(0));

            Product result = productService.decreaseStock(1, 3);

            assertThat(result.getQuantity()).isEqualTo(7);
        }

        @Test @DisplayName("недостаточный остаток → InsufficientStockException")
        void givenInsufficientStock_whenDecrease_thenThrows() {
            given(productRepository.findById(1)).willReturn(Optional.of(laptop));

            assertThatThrownBy(() -> productService.decreaseStock(1, 50))
                    .isInstanceOf(InsufficientStockException.class)
                    .hasMessageContaining("Requested: 50, available: 10");
        }

        @Test @DisplayName("несуществующий id → ProductNotFoundException")
        void givenMissingId_whenDecrease_thenThrows() {
            given(productRepository.findById(99)).willReturn(Optional.empty());

            assertThatThrownBy(() -> productService.decreaseStock(99, 1))
                    .isInstanceOf(ProductNotFoundException.class)
                    .hasMessageContaining("99");
        }
    }

    @Nested @DisplayName("increaseStock()")
    class IncreaseStock {

        @Test @DisplayName("корректное количество → остаток увеличивается, событие отправлено")
        void givenPositiveQty_whenIncrease_thenStockIncreasedAndEventPublished() {
            given(productRepository.findById(1)).willReturn(Optional.of(laptop));
            given(productRepository.save(any())).willAnswer(i -> i.getArgument(0));

            Product result = productService.increaseStock(1, 5);

            assertThat(result.getQuantity()).isEqualTo(15);
            then(kafkaTemplate).should().send(anyString(), eq(1), any());
        }
    }

    @Nested @DisplayName("searchProducts()")
    class SearchProducts {

        @Test @DisplayName("пустой запрос → возвращает все товары")
        void givenBlankQuery_whenSearch_thenReturnAll() {
            given(productRepository.findAll()).willReturn(List.of(laptop));

            List<Product> result = productService.searchProducts("  ");

            assertThat(result).hasSize(1);
            then(productRepository).should().findAll();
            then(productRepository).should(never()).findByNameContainingIgnoreCase(any());
        }

        @Test @DisplayName("непустой запрос → ищет по имени")
        void givenQuery_whenSearch_thenSearchByName() {
            given(productRepository.findByNameContainingIgnoreCase("ноут"))
                    .willReturn(List.of(laptop));

            List<Product> result = productService.searchProducts("ноут");

            assertThat(result).hasSize(1).first().extracting(Product::getName).isEqualTo("Ноутбук");
        }
    }
}
