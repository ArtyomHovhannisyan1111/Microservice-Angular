package com.example.orderservice.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum OrderStatus {
    PENDING,
    APPROVED,
    CONFIRMED,
    REJECTED,
    CANCELLED;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static OrderStatus fromString(String value) {
        return valueOf(value.toUpperCase());
    }
}
