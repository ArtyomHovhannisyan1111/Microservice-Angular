package com.example.orderservice.util;

import com.example.orderservice.Dto.ProductResponse;
import com.example.orderservice.model.Order;
import com.example.orderservice.model.OrderStatus;
import lombok.experimental.UtilityClass;

@UtilityClass
public class OrderValidationUtil {

    public static void validateProduct(ProductResponse product) {
        if (product == null) {
            throw new IllegalArgumentException("Product not found");
        }
    }

    public static void validateStock(ProductResponse product, Integer quantity) {
        if (product.getQuantity() == null || product.getQuantity() <= 0) {
            throw new IllegalArgumentException("Product is out of stock");
        }
        if (product.getQuantity() < quantity) {
            throw new IllegalArgumentException(
                    "Insufficient stock: available " + product.getQuantity() + ", requested " + quantity);
        }
    }

    public static void validateStatus(OrderStatus orderStatus, Order order) {
        if (order.getStatus() == orderStatus) {
            throw new IllegalArgumentException("Order already has status: " + orderStatus);
        }
    }
}