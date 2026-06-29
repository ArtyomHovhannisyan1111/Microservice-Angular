package com.example.notificationservice.util;

import lombok.experimental.UtilityClass;

import java.math.BigDecimal;

@UtilityClass
public class NotificationUtil {

    public static String buildTitle(Long orderId) {
        return "New Order #" + orderId;
    }

    public static String buildMessage(BigDecimal totalPrice) {
        return String.format(
                "Your order has been successfully created. Total amount: %s AMD.",
                totalPrice
        );
    }
}