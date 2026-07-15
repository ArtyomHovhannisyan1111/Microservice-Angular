package com.example.analyticsservice.controller;

import com.example.analyticsservice.dto.DashboardResponse;
import com.example.analyticsservice.dto.response.*;
import com.example.analyticsservice.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    public DashboardSummaryResponse getSummary() {
        return analyticsService.getSummary(); }

    @GetMapping("/revenue")
    public List<MonthlyDataResponse> getMonthlyRevenue() {
        return analyticsService.getMonthlyRevenue(); }

    @GetMapping("/orders")
    public List<MonthlyDataResponse> getMonthlyOrders() {
        return analyticsService.getMonthlyOrders(); }

    @GetMapping("/categories")
    public List<CategorySalesResponse> getCategorySales() {
        return analyticsService.getCategorySales(); }

    @GetMapping("/top-products")
    public List<TopProductResponse> getTopProducts() {
        return analyticsService.getTopProducts(); }

    @GetMapping("/statuses")
    public List<OrderStatusResponse> getOrderStatuses() {
        return analyticsService.getOrderStatuses(); }

    @GetMapping("/recent-orders")
    public List<RecentOrderResponse> getRecentOrders(@RequestParam(defaultValue = "10") int limit) {
        return analyticsService.getRecentOrders(limit);
    }

    @GetMapping("/products/dashboard")
    public DashboardResponse getDashboard() {
        return analyticsService.getDashboard(); }
}