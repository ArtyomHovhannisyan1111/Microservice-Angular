package com.example.analyticsservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "analytics")
public class AnalyticsConfig {
    private Dashboard dashboard = new Dashboard();

    @Getter
    @Setter
    public static class Dashboard {
        private int topProductsLimit = 5;
    }
}
