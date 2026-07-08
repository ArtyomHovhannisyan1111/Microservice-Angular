package com.example.analyticsservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecentOrderResponse {
    private String        id;
    private String        customer;
    private LocalDateTime date;
    private double        amount;
    private String        status;
}
