package com.example.orderservice.dto;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductResponse {
    private Integer productId;
    private String name;
    private BigDecimal price;
    private Integer quantity;
}