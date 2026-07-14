package com.example.orderservice.util;

import com.example.orderservice.Dto.ProductResponse;
import com.example.orderservice.exception.ResourceNotFoundException;
import com.example.orderservice.model.Order;
import com.example.orderservice.model.OrderStatus;
import com.example.orderservice.service.RequestLogService;
import lombok.experimental.UtilityClass;

@UtilityClass
public class OrderValidationUtil {

    public static void checkDuplicate(String requestId, RequestLogService requestLogService) {
        if (requestLogService.isDuplicate(requestId)) {
            throw new IllegalStateException("Duplicate request: " + requestId);
        }
    }

    public static void validateProduct(ProductResponse product) {
        if (product == null) {
            throw new ResourceNotFoundException("Product not found");
        }
    }

    public static void validateStock(ProductResponse product, Integer quantity) {
        if (product.getQuantity() < quantity) {
            throw new IllegalArgumentException("Insufficient stock");
        }
    }

    public static void validateCancelable(Order order) {
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.APPROVED) {
            throw new IllegalStateException("Order cannot be cancelled in current status: " + order.getStatus());
        }
    }
}

