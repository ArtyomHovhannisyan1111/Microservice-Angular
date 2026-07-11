package com.example.analyticsservice.service;

import com.example.analyticsservice.config.AnalyticsConfig;
import com.example.analyticsservice.dto.DashboardResponse;
import com.example.analyticsservice.dto.OrderItem;
import com.example.analyticsservice.dto.OrderPlacedEvent;
import com.example.analyticsservice.dto.external.OrderDto;
import com.example.analyticsservice.dto.response.*;
import com.example.analyticsservice.entity.ProductStatistics;
import com.example.analyticsservice.repository.ProductStatisticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ProductStatisticsRepository repository;
    private final AnalyticsConfig             analyticsConfig;
    private final ExternalDataService         externalDataService;

    @Transactional
    public void processOrderPlaced(OrderPlacedEvent event) {
        log.info("Processing OrderPlacedEvent id={}, items={}", event.getOrderId(), event.getItems().size());
        for (OrderItem item : event.getItems()) {
            double itemRevenue = item.getPrice() * item.getQuantity();
            repository.findById(item.getProductId()).ifPresentOrElse(
                existing -> {
                    existing.setTotalSoldQuantity(existing.getTotalSoldQuantity() + item.getQuantity());
                    existing.setTotalRevenue(existing.getTotalRevenue() + itemRevenue);
                    repository.save(existing);
                },
                () -> repository.save(ProductStatistics.builder()
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .totalSoldQuantity(item.getQuantity())
                        .totalRevenue(itemRevenue)
                        .build())
            );
        }
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        double totalRevenue = repository.sumTotalRevenue();
        int limit = analyticsConfig.getDashboard().getTopProductsLimit();
        return new DashboardResponse(totalRevenue, repository.findTopBySales(PageRequest.of(0, limit)));
    }

    public DashboardSummaryResponse getSummary() {
        List<OrderDto> orders = externalDataService.getAllOrders();
        long totalProducts    = externalDataService.getTotalProducts();

        double kafkaRevenue = repository.sumTotalRevenue();
        double restRevenue  = orders.stream()
                .filter(o -> o.getTotalPrice() != null)
                .mapToDouble(o -> o.getTotalPrice().doubleValue())
                .sum();
        double totalRevenue = BigDecimal.valueOf(kafkaRevenue > 0 ? kafkaRevenue : restRevenue)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();

        int currentMonth = YearMonth.now().getMonthValue();
        int prevMonth    = currentMonth == 1 ? 12 : currentMonth - 1;

        long totalCustomers = orders.stream()
                .filter(o -> o.getUserId() != null)
                .map(OrderDto::getUserId)
                .distinct().count();

        long thisMonth = orders.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().getMonthValue() == currentMonth)
                .count();
        long lastMonth = orders.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().getMonthValue() == prevMonth)
                .count();

        double ordersGrowth = lastMonth > 0
                ? Math.round((double) (thisMonth - lastMonth) / lastMonth * 1000.0) / 10.0
                : (thisMonth > 0 ? 100.0 : 0.0);

        double thisMonthRevenue = orders.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().getMonthValue() == currentMonth
                             && o.getTotalPrice() != null)
                .mapToDouble(o -> o.getTotalPrice().doubleValue())
                .sum();
        double lastMonthRevenue = orders.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().getMonthValue() == prevMonth
                             && o.getTotalPrice() != null)
                .mapToDouble(o -> o.getTotalPrice().doubleValue())
                .sum();
        double revenueGrowth = lastMonthRevenue > 0
                ? Math.round((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 1000.0) / 10.0
                : (thisMonthRevenue > 0 ? 100.0 : 0.0);

        long thisMonthCustomers = orders.stream()
                .filter(o -> o.getUserId() != null && o.getCreatedAt() != null
                             && o.getCreatedAt().getMonthValue() == currentMonth)
                .map(OrderDto::getUserId)
                .distinct().count();
        long lastMonthCustomers = orders.stream()
                .filter(o -> o.getUserId() != null && o.getCreatedAt() != null
                             && o.getCreatedAt().getMonthValue() == prevMonth)
                .map(OrderDto::getUserId)
                .distinct().count();
        double customersGrowth = lastMonthCustomers > 0
                ? Math.round((double) (thisMonthCustomers - lastMonthCustomers) / lastMonthCustomers * 1000.0) / 10.0
                : (thisMonthCustomers > 0 ? 100.0 : 0.0);

        return DashboardSummaryResponse.builder()
                .totalRevenue(totalRevenue)
                .revenueGrowth(revenueGrowth)
                .totalOrders(orders.size())
                .ordersGrowth(ordersGrowth)
                .totalCustomers(totalCustomers)
                .customersGrowth(customersGrowth)
                .totalProducts(totalProducts)
                .productsGrowth(0)
                .build();
    }

    public List<MonthlyDataResponse> getMonthlyRevenue() {
        List<OrderDto> orders  = externalDataService.getAllOrders();
        String[] months        = {"1","2","3","4","5","6","7","8","9","10","11","12"};
        Map<String, Double> rv = new LinkedHashMap<>();
        for (String m : months) rv.put(m, 0.0);

        int year = LocalDateTime.now().getYear();
        orders.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().getYear() == year
                             && o.getTotalPrice() != null)
                .forEach(o -> {
                    String key = months[o.getCreatedAt().getMonthValue() - 1];
                    rv.merge(key, o.getTotalPrice().doubleValue(), Double::sum);
                });

        return rv.entrySet().stream()
                .map(e -> new MonthlyDataResponse(e.getKey(), Math.round(e.getValue() * 100.0) / 100.0))
                .collect(Collectors.toList());
    }

    public List<MonthlyDataResponse> getMonthlyOrders() {
        List<OrderDto> orders = externalDataService.getAllOrders();
        String[] months       = {"1","2","3","4","5","6","7","8","9","10","11","12"};
        Map<String, Long> cnt = new LinkedHashMap<>();
        for (String m : months) cnt.put(m, 0L);

        int year = LocalDateTime.now().getYear();
        orders.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().getYear() == year)
                .forEach(o -> cnt.merge(months[o.getCreatedAt().getMonthValue() - 1], 1L, Long::sum));

        return cnt.entrySet().stream()
                .map(e -> new MonthlyDataResponse(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategorySalesResponse> getCategorySales() {
        List<ProductStatistics> stats      = repository.findAll();
        List<Map<String, Object>> products = externalDataService.getAllProducts();

        Map<String, String> nameToCategory = new HashMap<>();
        for (Map<String, Object> p : products) {
            Object name = p.get("name");
            Object cat  = p.get("category");
            if (name != null && cat != null) {
                nameToCategory.put(name.toString().toLowerCase(), cat.toString());
            }
        }

        Map<String, Long> byCat = new LinkedHashMap<>();
        for (ProductStatistics stat : stats) {
            String cat = nameToCategory.getOrDefault(stat.getProductName().toLowerCase(), "Другое");
            byCat.merge(cat, stat.getTotalSoldQuantity(), Long::sum);
        }

        if (byCat.isEmpty()) return List.of();

        long total = byCat.values().stream().mapToLong(Long::longValue).sum();
        if (total == 0) return List.of();

        return byCat.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> new CategorySalesResponse(
                        e.getKey(),
                        e.getValue(),
                        Math.round((double) e.getValue() / total * 1000.0) / 10.0))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TopProductResponse> getTopProducts() {
        int limit = analyticsConfig.getDashboard().getTopProductsLimit();
        return repository.findTopBySales(PageRequest.of(0, limit)).stream()
                .map(p -> new TopProductResponse(p.getProductName(), p.getTotalSoldQuantity(), p.getTotalRevenue()))
                .collect(Collectors.toList());
    }

    public List<OrderStatusResponse> getOrderStatuses() {
        List<OrderDto> orders = externalDataService.getAllOrders();
        if (orders.isEmpty()) return List.of();

        Map<String, Long> counts = orders.stream()
                .filter(o -> o.getStatus() != null)
                .collect(Collectors.groupingBy(
                        o -> o.getStatus().toUpperCase(),
                        Collectors.counting()));

        long total = orders.size();

        return counts.entrySet().stream()
                .map(e -> new OrderStatusResponse(
                        e.getKey().toLowerCase(),
                        e.getKey().toLowerCase(),
                        e.getValue(),
                        Math.round((double) e.getValue() / total * 1000.0) / 10.0))
                .sorted(Comparator.comparingLong(OrderStatusResponse::getCount).reversed())
                .collect(Collectors.toList());
    }

    public List<RecentOrderResponse> getRecentOrders(int limit) {
        List<OrderDto> orders = externalDataService.getAllOrders();
        return orders.stream()
                .sorted(Comparator.comparingInt((OrderDto o) -> o.getId() != null ? o.getId() : 0).reversed())
                .limit(limit)
                .map(o -> new RecentOrderResponse(
                        "#ORD-" + o.getId(),
                        resolveCustomerName(o),
                        o.getCreatedAt() != null ? o.getCreatedAt() : LocalDateTime.now(),
                        o.getTotalPrice() != null ? Math.round(o.getTotalPrice().doubleValue() * 100.0) / 100.0 : 0,
                        o.getStatus() != null ? o.getStatus().toLowerCase() : "pending"))
                .collect(Collectors.toList());
    }

    private String resolveCustomerName(OrderDto o) {
        if (o.getUserName() != null && !o.getUserName().isBlank()) return o.getUserName();
        if (o.getUserEmail() != null && !o.getUserEmail().isBlank()) return o.getUserEmail();
        return "#" + o.getUserId();
    }
}
