package com.example.analyticsservice.dto;

import com.example.analyticsservice.entity.ProductStatistics;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private double totalOverallRevenue;
    private List<ProductStatistics> topSellingProducts;
}
