package com.example.orderservice.util;

import com.example.orderservice.Dto.ProductResponse;
import com.example.orderservice.model.Order;
import com.example.orderservice.model.OrderStatus;
import lombok.experimental.UtilityClass;

@UtilityClass
public class OrderValidationUtil {
    public static  void validateProduct(ProductResponse product){
        if(product==null){
            throw new IllegalArgumentException("Product is null");
        }
    }
    public static  void  validateStatus(OrderStatus orderStatus, Order order){
        if (order.getStatus()==orderStatus){
            throw new IllegalArgumentException("Order already has this status");
        }
    }
}
