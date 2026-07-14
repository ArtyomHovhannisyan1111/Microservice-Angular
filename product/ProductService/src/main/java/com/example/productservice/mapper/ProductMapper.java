package com.example.productservice.mapper;

import com.example.productservice.dto.ProductRequest;
import com.example.productservice.model.Product;

public class ProductMapper {
    private  ProductMapper() {}

    public static Product toEntity(ProductRequest productRequest,String normalizedName) {
        return Product.builder()
                .name(normalizedName)
                .price(productRequest.getPrice())
                .quantity(productRequest.getQuantity())
                .imageUrl(productRequest.getImageUrl())
                .category(productRequest.getCategory())
                .categoryId(productRequest.getCategoryId())
                .description(productRequest.getDescription())
                .rating(productRequest.getRating() != null ? productRequest.getRating() : 0.0)
                .build();
    }
}
