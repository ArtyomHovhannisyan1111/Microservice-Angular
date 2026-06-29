package com.example.productservice.util;

import com.example.productservice.dto.ProductRequest;
import lombok.experimental.UtilityClass;

@UtilityClass
public class ProductValidationUtils {
    public void validatePositiveQuantity(Integer quantity){
        if(quantity==null||quantity<=0){
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }
    }
    public void validateThreshold(Integer threshold){
        if(threshold==null||threshold<0){
            throw new IllegalArgumentException("Threshold must be greater than zero");
        }
    }
    public String normalizeName(String name){
        if(name==null||name.isEmpty()){
            throw new IllegalArgumentException("Name must not be empty");
        }
        return name.trim();
    }
}