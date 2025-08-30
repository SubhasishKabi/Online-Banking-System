package com.example.bankingmini.account;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDto {
    private Long id;
    private Long accountId;
    private String type;
    private BigDecimal amount;
    private Long refAccountId;
    private String description;
    private String category;
    private Instant occurredAt;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class TransactionSearchCriteria {
    private Long accountId;
    private Instant startDate;
    private Instant endDate;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private String type;
    private String category;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class UpdateDescriptionRequest {
    private String description;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class UpdateCategoryRequest {
    private String category;
}
