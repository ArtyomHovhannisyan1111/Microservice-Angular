package com.example.productservice.service;

import com.example.productservice.config.KafkaTopicConfig;
import com.example.productservice.dto.ProductRequest;
import com.example.productservice.dto.ProductResponseDto;
import com.example.productservice.exception.InsufficientStockException;
import com.example.productservice.model.Product;
import com.example.productservice.exception.ProductAlreadyExistsException;
import com.example.productservice.exception.ProductNotFoundException;
import com.example.productservice.mapper.ProductMapper;
import com.example.productservice.repository.ProductRepository;
import com.example.productservice.util.ProductValidationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final KafkaTemplate<Integer, Object> kafkaTemplate;

    public List<Product> getProducts() {
        return productRepository.findAll();
    }

    public Product getProduct(Integer id) {
        return findProduct(id);
    }

    public List<Product> searchProducts(String name) {
        if (name == null || name.isBlank()) return getProducts();
        return productRepository.findByNameContainingIgnoreCase(name);
    }

    public List<Product> getLowStockProducts(Integer threshold) {
        ProductValidationUtils.validateThreshold(threshold);
        return productRepository.findByQuantityLessThanEqual(threshold);
    }

    @Transactional
    public Product saveProduct(ProductRequest request) {
        String normalizedName = ProductValidationUtils.normalizeName(request.getName());
        validateUniqueName(normalizedName, null);

        Product product = ProductMapper.toEntity(request, normalizedName);
        Product savedProduct = productRepository.save(product);

        publishProductEvent(savedProduct);

        return savedProduct;
    }

    @Transactional
    public Product updateProduct(Integer id, ProductRequest request) {
        Product product = findProduct(id);
        String normalizedName = ProductValidationUtils.normalizeName(request.getName());
        validateUniqueName(normalizedName, id);

        product.setName(normalizedName);
        product.setPrice(request.getPrice());
        product.setQuantity(request.getQuantity());
        product.setImageUrl(request.getImageUrl());
        product.setCategory(request.getCategory());
        product.setDescription(request.getDescription());

        Product updatedProduct = productRepository.save(product);
        publishProductEvent(updatedProduct);

        return updatedProduct;
    }

    @Transactional
    public void deleteProduct(Integer id) {
        Product product = findProduct(id);
        productRepository.delete(product);
    }

    @Transactional
    public Product increaseStock(Integer id, Integer quantity) {
        ProductValidationUtils.validatePositiveQuantity(quantity);

        Product product = findProduct(id);
        product.setQuantity(getCurrentStock(product) + quantity);

        Product updatedProduct = productRepository.save(product);
        publishProductEvent(updatedProduct);

        return updatedProduct;
    }

    @Transactional
    public Product decreaseStock(Integer id, Integer quantity) {
        ProductValidationUtils.validatePositiveQuantity(quantity);

        Product product = productRepository.findByIdWithLock(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        int current = getCurrentStock(product);
        if (current < quantity) {
            throw new InsufficientStockException(id, quantity, current);
        }
        product.setQuantity(current - quantity);

        return productRepository.save(product);
    }

    private void publishProductEvent(Product product) {
        try {
            kafkaTemplate.send(KafkaTopicConfig.PRODUCT_EVENTS_TOPIC, product.getId(), product);
        } catch (Exception e) {
            // Kafka unavailable — event skipped, product operation succeeds
        }
    }

    private Product findProduct(Integer id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }

    private void validateUniqueName(String name, Integer id) {
        if (id == null ? productRepository.existsByNameIgnoreCase(name)
                : productRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ProductAlreadyExistsException(name);
        }
    }

    private Integer getCurrentStock(Product product) {
        return product.getQuantity() == null ? 0 : product.getQuantity();
    }
    public Page<ProductResponseDto> getProducts(Long categoryId, String name, String category, Pageable pageable) {
        boolean hasName = name != null && !name.isBlank();
        boolean hasCat  = category != null && !category.isBlank();
        Page<Product> productPage;
        if (hasName && hasCat) {
            productPage = productRepository.findByNameContainingIgnoreCaseAndCategory(name, category, pageable);
        } else if (hasName) {
            productPage = productRepository.findByNameContainingIgnoreCase(name, pageable);
        } else if (hasCat) {
            productPage = productRepository.findByCategory(category, pageable);
        } else if (categoryId != null) {
            productPage = productRepository.findByCategoryId(categoryId, pageable);
        } else {
            productPage = productRepository.findAll(pageable);
        }
        return productPage.map(product -> new ProductResponseDto(
                product.getId(),
                product.getName(),
                product.getPrice(),
                product.getImageUrl(),
                product.getCategory(),
                product.getQuantity(),
                product.getDescription(),
                product.getRating()
        ));
    }

}