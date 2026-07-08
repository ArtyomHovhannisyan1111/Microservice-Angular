package com.example.analyticsservice.repository;

import com.example.analyticsservice.entity.ProductStatistics;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductStatisticsRepository extends JpaRepository<ProductStatistics, Long> {

    @Query("SELECT p FROM ProductStatistics p ORDER BY p.totalSoldQuantity DESC")
    List<ProductStatistics> findTopBySales(Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.totalRevenue), 0.0) FROM ProductStatistics p")
    double sumTotalRevenue();
}
