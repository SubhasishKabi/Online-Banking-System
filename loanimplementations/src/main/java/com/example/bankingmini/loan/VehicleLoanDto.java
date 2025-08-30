package com.example.bankingmini.loan;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleLoanDto {
    private Long id;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private Long accountId;
    private String accountNumber;
    private BigDecimal loanAmount;
    private BigDecimal interestRate;
    private Integer tenureMonths;
    private BigDecimal monthlyEmi;
    private String vehicleType;
    private String vehicleMake;
    private String vehicleModel;
    private Integer vehicleYear;
    private BigDecimal vehiclePrice;
    private BigDecimal downPayment;
    private String status;
    private Instant applicationDate;
    private Instant approvalDate;
    private Instant disbursementDate;
    private Instant emiStartDate;
    private BigDecimal outstandingAmount;
    private BigDecimal monthlyIncome;
    private String employmentType;
    private String rejectionReason;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class VehicleLoanApplicationRequest {
    private Long accountId;
    private BigDecimal loanAmount;
    private BigDecimal interestRate;
    private Integer tenureMonths;
    private String vehicleType;
    private String vehicleMake;
    private String vehicleModel;
    private Integer vehicleYear;
    private BigDecimal vehiclePrice;
    private BigDecimal downPayment;
    private BigDecimal monthlyIncome;
    private String employmentType;
    private String incomeProof;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class RejectLoanRequest {
    private String reason;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class RenewVehicleLoanRequest {
    private BigDecimal additionalAmount;
    private Integer newTenure;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class PayVehicleLoanInstallmentRequest {
    private BigDecimal amount;
}
