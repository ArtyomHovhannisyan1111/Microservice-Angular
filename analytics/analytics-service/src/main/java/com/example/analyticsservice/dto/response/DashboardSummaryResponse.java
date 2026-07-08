package com.example.analyticsservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private double totalRevenue;
    private double revenueGrowth;
    private long   totalOrders;
    private double ordersGrowth;
    private long   totalCustomers;
    private double customersGrowth;
    private long   totalProducts;
    private double productsGrowth;
}
