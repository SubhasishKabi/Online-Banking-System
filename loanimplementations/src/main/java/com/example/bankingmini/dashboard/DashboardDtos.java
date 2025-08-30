package com.example.bankingmini.dashboard;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class CustomerDashboardDto {
    private Integer totalVehicleLoans;
    private Integer totalStudentLoans;
    private BigDecimal totalOutstandingAmount;
    private BigDecimal totalMonthlyEMI;
    private BigDecimal accountBalance;
    private List<RecentActivityDto> recentActivities;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class LoanOfficerDashboardDto {
    private Integer pendingVehicleLoans;
    private Integer pendingStudentLoans;
    private Integer totalPendingReview;
    private BigDecimal totalDisbursedAmount;
    private Integer loansProcessedThisMonth;
    private Map<String, Integer> loanStatusDistribution;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class AdminDashboardDto {
    private Long totalCustomers;
    private Long totalAccounts;
    private Integer totalVehicleLoans;
    private Integer totalStudentLoans;
    private Integer totalGeneralLoans;
    private BigDecimal totalLoanPortfolio;
    private BigDecimal totalOutstandingAmount;
    private Long overdueLoans;
    private BigDecimal collectionEfficiency;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class LoanAnalyticsDto {
    private Map<String, BigDecimal> monthlyDisbursements;
    private Map<String, Integer> loanTypeDistribution;
    private Map<String, BigDecimal> riskAnalysis;
    private BigDecimal averageProcessingTime;
    private BigDecimal approvalRate;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class PortfolioSummaryDto {
    private BigDecimal totalPortfolioValue;
    private Integer activeLoans;
    private Map<String, BigDecimal> performanceMetrics;
    private List<SegmentPerformanceDto> topPerformingSegments;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class RecentActivityDto {
    private String type;
    private String description;
    private BigDecimal amount;
    private String status;
    private Instant date;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class SegmentPerformanceDto {
    private String segmentName;
    private BigDecimal totalAmount;
    private BigDecimal recoveryRate;
}
//public class DashboardDtos{
//
//}
