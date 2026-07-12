package com.example.productservice.service;

import com.example.productservice.dto.ReviewRequest;
import com.example.productservice.dto.ReviewResponse;
import com.example.productservice.exception.ProductNotFoundException;
import com.example.productservice.exception.ReviewNotFoundException;
import com.example.productservice.model.Product;
import com.example.productservice.model.Review;
import com.example.productservice.repository.ProductRepository;
import com.example.productservice.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviews(Integer productId) {
        findProduct(productId);
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReviewResponse addReview(Integer productId, ReviewRequest request) {
        findProduct(productId);
        if (reviewRepository.existsByProductIdAndUserId(productId, request.getUserId())) {
            throw new IllegalArgumentException("You have already reviewed this product");
        }
        Review review = Review.builder()
                .productId(productId)
                .userId(request.getUserId())
                .username(request.getUsername())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();
        Review saved = reviewRepository.save(review);
        updateProductRating(productId);
        return toResponse(saved);
    }

    @Transactional
    public void deleteReview(Long reviewId, Integer productId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ReviewNotFoundException(reviewId));
        reviewRepository.delete(review);
        updateProductRating(productId);
    }

    private void updateProductRating(Integer productId) {
        Double avg = reviewRepository.calculateAverageRating(productId);
        Product product = findProduct(productId);
        product.setRating(avg != null ? avg : 0.0);
        productRepository.save(product);
    }

    private Product findProduct(Integer productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
    }

    private ReviewResponse toResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .productId(r.getProductId())
                .userId(r.getUserId())
                .username(r.getUsername())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
