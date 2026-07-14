package com.example.analyticsservice.service;

import com.example.analyticsservice.dto.DashboardResponse;
import com.example.analyticsservice.dto.OrderPlacedEvent;
import com.example.analyticsservice.dto.external.OrderDto;
import com.example.analyticsservice.dto.response.DashboardSummaryResponse;
import com.example.analyticsservice.entity.ProductStatistics;
import com.example.analyticsservice.repository.ProductStatisticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {
    private final ProductStatisticsRepository repository;
    private final ExternalDataService external;
    @Value("${analytics.dashboard.top-products-limit:5}") private int limit;

    @Transactional
    public void processOrderPlaced(OrderPlacedEvent e) {
        e.getItems().forEach(i -> {
            var p = repository.findById(i.getProductId()).orElse(ProductStatistics.builder().productId(i.getProductId()).productName(i.getProductName()).build());
            p.setTotalSoldQuantity(p.getTotalSoldQuantity() + i.getQuantity());
            p.setTotalRevenue(p.getTotalRevenue() + (i.getPrice() * i.getQuantity()));
            repository.save(p);
        });
    }

    public DashboardResponse getDashboard() {
        return new DashboardResponse(repository.sumTotalRevenue(), repository.findTopBySales(PageRequest.of(0, limit)));
    }

    public DashboardSummaryResponse getSummary() {
        var orders = external.getAllOrders();
        int now = LocalDateTime.now().getMonthValue(), prev = now == 1 ? 12 : now - 1;
        long n = count(orders, now), p = count(orders, prev);
        return DashboardSummaryResponse.builder()
                .totalRevenue(round(repository.sumTotalRevenue(), 2)).totalOrders(orders.size())
                .ordersGrowth(p > 0 ? round((double)(n - p) / p * 100, 1) : 0)
                .totalCustomers(orders.stream().map(OrderDto::getUserId).filter(Objects::nonNull).distinct().count())
                .totalProducts(external.getTotalProducts()).build();
    }

    private static double round(double v, int p) { double f = Math.pow(10, p); return Math.round(v * f) / f; }
    private static long count(List<OrderDto> o, int m) { return o.stream().filter(x -> x.getCreatedAt() != null && x.getCreatedAt().getMonthValue() == m).count(); }
}