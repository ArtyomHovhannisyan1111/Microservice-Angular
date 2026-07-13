package com.example.analyticsservice.service;

import com.example.analyticsservice.dto.external.OrderDto;
import com.example.analyticsservice.dto.response.DashboardSummaryResponse;
import com.example.analyticsservice.dto.response.MonthlyDataResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ExternalDataService externalDataService;

    public DashboardSummaryResponse getSummary() {
        List<OrderDto> orders = externalDataService.getAllOrders();
        int curMonth = LocalDateTime.now().getMonthValue();
        int prevMonth = curMonth == 1 ? 12 : curMonth - 1;

        Map<Integer, double[]> byMonth = orders.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt() != null ? o.getCreatedAt().getMonthValue() : 0,
                        Collectors.collectingAndThen(Collectors.toList(), list -> new double[]{
                                list.stream()
                                        .filter(o -> o.getTotalPrice() != null)
                                        .mapToDouble(o -> o.getTotalPrice().doubleValue())
                                        .sum(),
                                list.size(),
                                list.stream().map(OrderDto::getUserId).filter(Objects::nonNull).distinct().count()
                        })
                ));

        double[] zeros = {0, 0, 0};
        double[] cur = byMonth.getOrDefault(curMonth, zeros);
        double[] prev = byMonth.getOrDefault(prevMonth, zeros);

        long totalCustomers = orders.stream()
                .map(OrderDto::getUserId)
                .filter(Objects::nonNull)
                .distinct()
                .count();

        return DashboardSummaryResponse.builder()
                .totalRevenue(cur[0])
                .totalOrders(orders.size())
                .totalCustomers(totalCustomers)
                .revenueGrowth(calculateGrowth(cur[0], prev[0]))
                .ordersGrowth(calculateGrowth(cur[1], prev[1]))
                .customersGrowth(calculateGrowth(cur[2], prev[2]))
                .build();
    }

    public List<MonthlyDataResponse> getMonthlyData(boolean isRevenue) {
        int year = LocalDateTime.now().getYear();

        Map<Integer, Double> monthlyData = externalDataService.getAllOrders().stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().getYear() == year)
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt().getMonthValue(),
                        Collectors.summingDouble(o -> {
                            if (!isRevenue) return 1.0;
                            return o.getTotalPrice() != null ? o.getTotalPrice().doubleValue() : 0.0;
                        })
                ));

        return IntStream.rangeClosed(1, 12)
                .mapToObj(m -> new MonthlyDataResponse(
                        String.valueOf(m),
                        Math.round(monthlyData.getOrDefault(m, 0.0) * 100.0) / 100.0
                ))
                .collect(Collectors.toList());
    }

    private double calculateGrowth(double current, double previous) {
        if (previous == 0) return current > 0 ? 100.0 : 0.0;
        return Math.round((current - previous) / previous * 1000.0) / 10.0;
    }
}