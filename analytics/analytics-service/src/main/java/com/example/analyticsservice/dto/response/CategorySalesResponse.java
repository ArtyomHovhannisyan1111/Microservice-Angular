package com.example.analyticsservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategorySalesResponse {
    private String category;
    private long   sales;
    private double percentage;
}
