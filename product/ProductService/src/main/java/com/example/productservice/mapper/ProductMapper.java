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
                .build();
    }
}
