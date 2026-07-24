package com.example.analyticsservice.service;

import com.example.analyticsservice.dto.*;
import com.example.analyticsservice.dto.external.*;
import com.example.analyticsservice.dto.response.*;
import com.example.analyticsservice.entity.*;
import com.example.analyticsservice.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.*;

@Service @RequiredArgsConstructor
public class AnalyticsService {
    private static final String[] MONTHS = {"Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"};
    private static final Map<String, String> STATUS_LABELS = Map.of(
            "PENDING","Ожидание","CONFIRMED","Подтверждён","PAID","Оплачен",
            "SHIPPED","Отправлен","DELIVERED","Доставлен","CANCELLED","Отменён");
    private final ProductStatisticsRepository repo;
    private final ExternalDataService external;
    @Value("${analytics.dashboard.top-products-limit:5}") private int limit;

    @Transactional
    public void processOrderPlaced(OrderPlacedEvent e) {
        e.getItems().forEach(i -> {
            var p = repo.findById(i.getProductId()).orElseGet(() -> ProductStatistics.builder()
                    .productId(i.getProductId()).productName(i.getProductName()).build());
            p.setTotalSoldQuantity(p.getTotalSoldQuantity() + i.getQuantity());
            p.setTotalRevenue(p.getTotalRevenue() + i.getPrice() * i.getQuantity());
            repo.save(p);
        });
    }
    public DashboardResponse getDashboard() {
        return new DashboardResponse(repo.sumTotalRevenue(), repo.findTopBySales(PageRequest.of(0, limit)));
    }
    public DashboardSummaryResponse getSummary() {
        var o = external.getAllOrders();
        int cur = LocalDateTime.now().getMonthValue(), prev = cur == 1 ? 12 : cur - 1;
        long cc = countByMonth(o, cur), pc = countByMonth(o, prev);
        return DashboardSummaryResponse.builder().totalRevenue(round2(repo.sumTotalRevenue())).totalOrders(o.size())
                .ordersGrowth(pc > 0 ? round1(100.0 * (cc - pc) / pc) : 0)
                .totalCustomers(o.stream().map(OrderDto::getUserId).filter(Objects::nonNull).distinct().count())
                .totalProducts(external.getTotalProducts()).build();
    }
    public List<MonthlyDataResponse> getMonthlyRevenue() {
        Map<String, Double> map = monthMap(0.0);
        ordersThisYear().stream().filter(o -> o.getTotalPrice() != null)
                .forEach(o -> map.merge(month(o), o.getTotalPrice().doubleValue(), Double::sum));
        return map.entrySet().stream().map(e -> new MonthlyDataResponse(e.getKey(), round2(e.getValue()))).toList();
    }
    public List<MonthlyDataResponse> getMonthlyOrders() {
        Map<String, Long> map = monthMap(0L);
        ordersThisYear().forEach(o -> map.merge(month(o), 1L, Long::sum));
        return map.entrySet().stream().map(e -> new MonthlyDataResponse(e.getKey(), e.getValue())).toList();
    }
    public List<CategorySalesResponse> getCategorySales() {
        var nc = external.getAllProducts().stream().filter(p -> p.get("name") != null && p.get("category") != null)
                .collect(Collectors.toMap(p -> p.get("name").toString().toLowerCase(), p -> p.get("category").toString(), (a, b) -> a));
        var bc = new LinkedHashMap<String, Long>();
        repo.findAll().forEach(s -> bc.merge(nc.getOrDefault(s.getProductName().toLowerCase(), "Другое"), s.getTotalSoldQuantity(), Long::sum));
        long total = bc.values().stream().mapToLong(Long::longValue).sum();
        if (total == 0) return List.of();
        return bc.entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> new CategorySalesResponse(e.getKey(), e.getValue(), pct(e.getValue(), total))).toList();
    }
    public List<TopProductResponse> getTopProducts() {
        return repo.findTopBySales(PageRequest.of(0, limit)).stream()
                .map(p -> new TopProductResponse(p.getProductName(), p.getTotalSoldQuantity(), p.getTotalRevenue())).toList();
    }
    public List<OrderStatusResponse> getOrderStatuses() {
        var o = external.getAllOrders(); if (o.isEmpty()) return List.of(); long total = o.size();
        return o.stream().filter(x -> x.getStatus() != null)
                .collect(Collectors.groupingBy(x -> x.getStatus().toUpperCase(), Collectors.counting()))
                .entrySet().stream().map(e -> new OrderStatusResponse(e.getKey().toLowerCase(),
                        STATUS_LABELS.getOrDefault(e.getKey(), e.getKey()), e.getValue(), pct(e.getValue(), total)))
                .sorted(Comparator.comparingLong(OrderStatusResponse::getCount).reversed()).toList();
    }
    public List<RecentOrderResponse> getRecentOrders(int n) {
        return external.getAllOrders().stream()
                .sorted(Comparator.comparingInt((OrderDto o) -> o.getId() != null ? o.getId() : 0).reversed()).limit(n)
                .map(o -> new RecentOrderResponse("#ORD-" + o.getId(),
                        Stream.of(o.getUserName(), o.getUserEmail()).filter(s -> s != null && !s.isBlank()).findFirst().orElse("Пользователь " + o.getUserId()),
                        o.getCreatedAt() != null ? o.getCreatedAt() : LocalDateTime.now(),
                        o.getTotalPrice() != null ? round2(o.getTotalPrice().doubleValue()) : 0,
                        o.getStatus() != null ? o.getStatus().toLowerCase() : "pending")).toList();
    }

    private List<OrderDto> ordersThisYear() { int y = LocalDateTime.now().getYear(); return external.getAllOrders().stream().filter(o -> o.getCreatedAt() != null && o.getCreatedAt().getYear() == y).toList(); }
    private static long countByMonth(List<OrderDto> o, int m) { return o.stream().filter(x -> x.getCreatedAt() != null && x.getCreatedAt().getMonthValue() == m).count(); }
    private static String month(OrderDto o) { return MONTHS[o.getCreatedAt().getMonthValue() - 1]; }
    private static <V> LinkedHashMap<String, V> monthMap(V d) { return Arrays.stream(MONTHS).collect(Collectors.toMap(k -> k, k -> d, (a, b) -> a, LinkedHashMap::new)); }
    private static double pct(double p, double t) { return round1(p / t * 100); }
    private static double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }
}
