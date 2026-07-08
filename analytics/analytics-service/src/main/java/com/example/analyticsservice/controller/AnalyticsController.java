package com.example.analyticsservice.controller;

import com.example.analyticsservice.dto.DashboardResponse;
import com.example.analyticsservice.dto.response.*;
import com.example.analyticsservice.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getSummary() {
        return ResponseEntity.ok(analyticsService.getSummary());
    }

    @GetMapping("/revenue")
    public ResponseEntity<List<MonthlyDataResponse>> getMonthlyRevenue() {
        return ResponseEntity.ok(analyticsService.getMonthlyRevenue());
    }

    @GetMapping("/orders")
    public ResponseEntity<List<MonthlyDataResponse>> getMonthlyOrders() {
        return ResponseEntity.ok(analyticsService.getMonthlyOrders());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategorySalesResponse>> getCategorySales() {
        return ResponseEntity.ok(analyticsService.getCategorySales());
    }

    @GetMapping("/top-products")
    public ResponseEntity<List<TopProductResponse>> getTopProducts() {
        return ResponseEntity.ok(analyticsService.getTopProducts());
    }

    @GetMapping("/statuses")
    public ResponseEntity<List<OrderStatusResponse>> getOrderStatuses() {
        return ResponseEntity.ok(analyticsService.getOrderStatuses());
    }

    @GetMapping("/recent-orders")
    public ResponseEntity<List<RecentOrderResponse>> getRecentOrders(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getRecentOrders(limit));
    }

    @GetMapping("/products/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard() {
        return ResponseEntity.ok(analyticsService.getDashboard());
    }
}
