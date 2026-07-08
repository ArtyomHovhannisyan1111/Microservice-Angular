package com.example.analyticsservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "product_statistics")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductStatistics {

    @Id
    @Column(name = "product_id")
    private Long productId;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "total_sold_quantity", nullable = false)
    private long totalSoldQuantity;

    @Column(name = "total_revenue", nullable = false)
    private double totalRevenue;
}
