package com.example.productservice.controller;

import com.example.productservice.dto.ProductRequest;
import com.example.productservice.exception.GlobalExceptionHandler;
import com.example.productservice.exception.ProductNotFoundException;
import com.example.productservice.model.Product;
import com.example.productservice.service.ProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductController.class)
@Import(GlobalExceptionHandler.class)
@DisplayName("ProductController")
class ProductControllerTest {

    @Autowired MockMvc     mockMvc;
    @Autowired ObjectMapper mapper;
    @MockBean  ProductService productService;

    private ProductRequest validRequest() {
        return ProductRequest.builder()
                .name("Ноутбук").price(new BigDecimal("80000")).quantity(5).build();
    }

    private Product savedProduct() {
        return Product.builder().id(1).name("Ноутбук")
                .price(new BigDecimal("80000")).quantity(5).build();
    }

    @Nested @DisplayName("POST /api/products")
    class Create {

        @Test @DisplayName("валидный запрос → 201 с телом товара")
        void givenValid_whenCreate_thenReturns201() throws Exception {
            given(productService.saveProduct(any())).willReturn(savedProduct());

            mockMvc.perform(post("/api/products")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(validRequest())))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.name").value("Ноутбук"));
        }

        @Test @DisplayName("пустое имя → 400 с сообщением валидации")
        void givenBlankName_whenCreate_thenReturns400() throws Exception {
            ProductRequest bad = validRequest();
            bad.setName("");

            mockMvc.perform(post("/api/products")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(bad)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.name").value("Product name cannot be empty"));
        }

        @Test @DisplayName("цена = 0 → 400 (@Positive)")
        void givenZeroPrice_whenCreate_thenReturns400() throws Exception {
            ProductRequest bad = validRequest();
            bad.setPrice(BigDecimal.ZERO);

            mockMvc.perform(post("/api/products")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(bad)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.price").value("Price must be greater than zero"));
        }
    }

    @Nested @DisplayName("GET /api/products/{id}")
    class GetById {

        @Test @DisplayName("существующий id → 200 OK")
        void givenExistingId_thenReturns200() throws Exception {
            given(productService.getProduct(1)).willReturn(savedProduct());

            mockMvc.perform(get("/api/products/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1));
        }

        @Test @DisplayName("несуществующий id → 404")
        void givenMissingId_thenReturns404() throws Exception {
            given(productService.getProduct(99))
                    .willThrow(new ProductNotFoundException(99));

            mockMvc.perform(get("/api/products/99"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested @DisplayName("DELETE /api/products/{id}")
    class Delete {

        @Test @DisplayName("существующий id → 204 No Content")
        void givenExistingId_whenDelete_thenReturns204() throws Exception {
            mockMvc.perform(delete("/api/products/1"))
                    .andExpect(status().isNoContent());
        }
    }
}
