package com.example.productservice.exception;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(Integer id, Integer requested, Integer available) {
        super("Insufficient stock for product ID " + id + ". Requested: " + requested + ", available: " + available);
    }
}
