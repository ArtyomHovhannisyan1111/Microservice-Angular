package com.example.analyticsservice.service;

import com.example.analyticsservice.dto.DashboardResponse;
import com.example.analyticsservice.dto.OrderPlacedEvent;
import com.example.analyticsservice.dto.external.OrderDto;
import com.example.analyticsservice.dto.response.*;
import com.example.analyticsservice.entity.ProductStatistics;
import com.example.analyticsservice.repository.ProductStatisticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final String[] MONTHS = {"Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"};
    private static final Map<String, String> STATUS_LABELS = Map.of(
            "PENDING","Ожидание", "PAID","Оплачен", "SHIPPED","Отправлен",
            "DELIVERED","Доставлен", "CANCELLED","Отменён");

    private final ProductStatisticsRepository repository;
    private final ExternalDataService external;

    @Value("${analytics.dashboard.top-products-limit:5}")
    private int limit;

    @Transactional
    public void processOrderPlaced(OrderPlacedEvent e) {
        e.getItems().forEach(i -> {
            var p = repository.findById(i.getProductId()).orElse(
                    ProductStatistics.builder().productId(i.getProductId()).productName(i.getProductName()).build());
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
        int cur = LocalDateTime.now().getMonthValue(), prev = cur == 1 ? 12 : cur - 1;
        long thisMonth = countByMonth(orders, cur), lastMonth = countByMonth(orders, prev);
        return DashboardSummaryResponse.builder()
                .totalRevenue(round2(repository.sumTotalRevenue()))
                .totalOrders(orders.size())
                .ordersGrowth(lastMonth > 0 ? round1((double)(thisMonth - lastMonth) / lastMonth * 100) : 0)
                .totalCustomers(orders.stream().map(OrderDto::getUserId).filter(Objects::nonNull).distinct().count())
                .totalProducts(external.getTotalProducts())
                .build();
    }

    public List<MonthlyDataResponse> getMonthlyRevenue() {
        int year = LocalDateTime.now().getYear();
        Map<String, Double> rv = monthMap(0.0);
        external.getAllOrders().stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().getYear() == year && o.getTotalPrice() != null)
                .forEach(o -> rv.merge(MONTHS[o.getCreatedAt().getMonthValue() - 1], o.getTotalPrice().doubleValue(), Double::sum));
        return rv.entrySet().stream()
                .map(e -> new MonthlyDataResponse(e.getKey(), round2(e.getValue())))
                .collect(Collectors.toList());
    }

    public List<MonthlyDataResponse> getMonthlyOrders() {
        int year = LocalDateTime.now().getYear();
        Map<String, Long> cnt = monthMap(0L);
        external.getAllOrders().stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().getYear() == year)
                .forEach(o -> cnt.merge(MONTHS[o.getCreatedAt().getMonthValue() - 1], 1L, Long::sum));
        return cnt.entrySet().stream()
                .map(e -> new MonthlyDataResponse(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    public List<CategorySalesResponse> getCategorySales() {
        Map<String, String> nameToCategory = external.getAllProducts().stream()
                .filter(p -> p.get("name") != null && p.get("category") != null)
                .collect(Collectors.toMap(
                        p -> p.get("name").toString().toLowerCase(),
                        p -> p.get("category").toString(),
                        (a, b) -> a));

        Map<String, Long> byCat = new LinkedHashMap<>();
        repository.findAll().forEach(s ->
                byCat.merge(nameToCategory.getOrDefault(s.getProductName().toLowerCase(), "Другое"),
                        s.getTotalSoldQuantity(), Long::sum));

        long total = byCat.values().stream().mapToLong(Long::longValue).sum();
        if (total == 0) return List.of();

        return byCat.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> new CategorySalesResponse(e.getKey(), e.getValue(), round1((double) e.getValue() / total * 100)))
                .collect(Collectors.toList());
    }

    public List<TopProductResponse> getTopProducts() {
        return repository.findTopBySales(PageRequest.of(0, limit)).stream()
                .map(p -> new TopProductResponse(p.getProductName(), p.getTotalSoldQuantity(), p.getTotalRevenue()))
                .collect(Collectors.toList());
    }

    public List<OrderStatusResponse> getOrderStatuses() {
        List<OrderDto> orders = external.getAllOrders();
        if (orders.isEmpty()) return List.of();
        long total = orders.size();
        return orders.stream()
                .filter(o -> o.getStatus() != null)
                .collect(Collectors.groupingBy(o -> o.getStatus().toUpperCase(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> new OrderStatusResponse(e.getKey().toLowerCase(),
                        STATUS_LABELS.getOrDefault(e.getKey(), e.getKey()),
                        e.getValue(), round1((double) e.getValue() / total * 100)))
                .sorted(Comparator.comparingLong(OrderStatusResponse::getCount).reversed())
                .collect(Collectors.toList());
    }

    public List<RecentOrderResponse> getRecentOrders(int n) {
        return external.getAllOrders().stream()
                .sorted(Comparator.comparingInt((OrderDto o) -> o.getId() != null ? o.getId() : 0).reversed())
                .limit(n)
                .map(o -> new RecentOrderResponse(
                        "#ORD-" + o.getId(),
                        resolveCustomer(o),
                        o.getCreatedAt() != null ? o.getCreatedAt() : LocalDateTime.now(),
                        o.getTotalPrice() != null ? round2(o.getTotalPrice().doubleValue()) : 0,
                        o.getStatus() != null ? o.getStatus().toLowerCase() : "pending"))
                .collect(Collectors.toList());
    }

    private String resolveCustomer(OrderDto o) {
        if (o.getUserName() != null && !o.getUserName().isBlank()) return o.getUserName();
        if (o.getUserEmail() != null && !o.getUserEmail().isBlank()) return o.getUserEmail();
        return "Пользователь " + o.getUserId();
    }

    private static <V> LinkedHashMap<String, V> monthMap(V zero) {
        LinkedHashMap<String, V> map = new LinkedHashMap<>();
        for (String m : MONTHS) map.put(m, zero);
        return map;
    }

    private static long countByMonth(List<OrderDto> orders, int month) {
        return orders.stream().filter(o -> o.getCreatedAt() != null && o.getCreatedAt().getMonthValue() == month).count();
    }

    private static double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }
}
