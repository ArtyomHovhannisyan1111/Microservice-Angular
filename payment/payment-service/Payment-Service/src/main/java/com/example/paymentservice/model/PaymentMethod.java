package com.example.paymentservice.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table
@Builder
public class PaymentMethod {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String type;

    @Column(name = "provider_name",nullable = false)
    private String providerName;

    @Column(name = "account_token",nullable = false)
    private String accountToken;

    @Column(name = "masked_number")
    private String maskedNumber;

    @Column(name = "cardholder_name", nullable = false)
    private String cardholderName;

    private boolean isActive;

    private BigDecimal amount;



}
