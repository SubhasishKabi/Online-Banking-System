package com.example.bankingmini.loan;

import com.example.bankingmini.auth.Customer;
import com.example.bankingmini.auth.CustomerRepository;
import com.example.bankingmini.account.Account;
import com.example.bankingmini.account.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class StudentLoanService {

    @Autowired
    private StudentLoanRepository studentLoanRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private LoanInstallmentRepository installmentRepository;

    @Autowired
    private AccountRepository accountRepository;

    public StudentLoanDto applyForLoan(StudentLoanApplicationRequest request, Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Account account = null;
        if (request.getAccountId() != null) {
            account = accountRepository.findById(request.getAccountId())
                    .orElseThrow(() -> new RuntimeException("Account not found"));

            if (!account.getCustomer().getId().equals(customerId)) {
                throw new RuntimeException("Account does not belong to customer");
            }

            if (!"ACTIVE".equals(account.getStatus())) {
                throw new RuntimeException("Account must be active for loan application");
            }
        }

        StudentLoan loan = StudentLoan.builder()
                .customer(customer)
                .account(account) // Added account relationship
                .loanAmount(request.getLoanAmount())
                .interestRate(request.getInterestRate())
                .tenureMonths(request.getTenureMonths())
                .courseName(request.getCourseName())
                .institutionName(request.getInstitutionName())
                .courseDurationYears(request.getCourseDurationYears())
                .courseFee(request.getCourseFee())
                .academicYear(request.getAcademicYear())
                .studentName(request.getStudentName())
                .studentAge(request.getStudentAge())
                .guardianName(request.getGuardianName())
                .guardianIncome(request.getGuardianIncome())
                .collateralProvided(request.getCollateralProvided())
                .collateralDetails(request.getCollateralDetails())
                .moratoriumPeriodMonths(request.getMoratoriumPeriodMonths())
                .disbursementType(request.getDisbursementType())
                .applicationDate(Instant.now())
                .outstandingAmount(request.getLoanAmount())
                .build();

        StudentLoan savedLoan = studentLoanRepository.save(loan);
        return convertToDto(savedLoan);
    }

    public List<StudentLoanDto> getCustomerLoans(Long customerId) {
        List<StudentLoan> loans = studentLoanRepository.findByCustomerIdOrderByApplicationDateDesc(customerId);
        return loans.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public StudentLoanDto getLoanDetails(Long loanId, Long customerId) {
        StudentLoan loan = studentLoanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        if (!loan.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Access denied: Loan does not belong to user");
        }

        return convertToDto(loan);
    }

    public Page<StudentLoanDto> getPendingLoans(Pageable pageable) {
        Page<StudentLoan> loans = studentLoanRepository.findByStatusOrderByApplicationDateDesc("PENDING", pageable);
        return loans.map(this::convertToDto);
    }

    public void approveLoan(Long loanId, Long officerId) {
        StudentLoan loan = studentLoanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        if (!loan.isPending()) {
            throw new RuntimeException("Loan is not in pending status");
        }

        // Calculate EMI (will start after moratorium period)
        BigDecimal monthlyEmi = calculateEMI(loan.getLoanAmount(), loan.getInterestRate(), loan.getTenureMonths());

        loan.setStatus("APPROVED");
        loan.setApprovalDate(Instant.now());
        loan.setApprovedBy(officerId);
        loan.setMonthlyEmi(monthlyEmi);

        // Set next disbursement details based on disbursement type
        if ("SEMESTER_WISE".equals(loan.getDisbursementType())) {
            loan.setNextDisbursementAmount(loan.getLoanAmount().divide(BigDecimal.valueOf(loan.getCourseDurationYears() * 2), 2, RoundingMode.HALF_UP));
            loan.setNextDisbursementDate(Instant.now().plus(30, ChronoUnit.DAYS));
        } else if ("YEARLY".equals(loan.getDisbursementType())) {
            loan.setNextDisbursementAmount(loan.getLoanAmount().divide(BigDecimal.valueOf(loan.getCourseDurationYears()), 2, RoundingMode.HALF_UP));
            loan.setNextDisbursementDate(Instant.now().plus(30, ChronoUnit.DAYS));
        } else {
            loan.setNextDisbursementAmount(loan.getLoanAmount());
            loan.setNextDisbursementDate(Instant.now().plus(7, ChronoUnit.DAYS));
        }

        studentLoanRepository.save(loan);
    }

    public void rejectLoan(Long loanId, String reason, Long officerId) {
        StudentLoan loan = studentLoanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        if (!loan.isPending()) {
            throw new RuntimeException("Loan is not in pending status");
        }

        loan.setStatus("REJECTED");
        loan.setRejectionReason(reason);
        loan.setApprovedBy(officerId);
        studentLoanRepository.save(loan);
    }

    public void disburseLoan(Long loanId) {
        StudentLoan loan = studentLoanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        if (!loan.isApproved() && !loan.isDisbursed()) {
            throw new RuntimeException("Loan is not approved for disbursement");
        }

        BigDecimal disbursementAmount = loan.getNextDisbursementAmount(); // <-- use stored value

        if (loan.getAccount() != null) {
            Account account = loan.getAccount();
            account.setBalance(account.getBalance().add(disbursementAmount));
            accountRepository.save(account);
        }

        loan.setStatus("DISBURSED");
        if (loan.getDisbursementDate() == null) {
            loan.setDisbursementDate(Instant.now());
        }

        // Update next disbursement
        BigDecimal remainingAmount = loan.getOutstandingAmount().subtract(disbursementAmount);
        if (remainingAmount.compareTo(BigDecimal.ZERO) > 0) {
            loan.setNextDisbursementAmount(remainingAmount);
            loan.setNextDisbursementDate(Instant.now().plus(180, ChronoUnit.DAYS));
        } else {
            loan.setNextDisbursementAmount(null);
            loan.setNextDisbursementDate(null);
            loan.setStatus("ACTIVE");

            Instant courseEndDate = Instant.now().plus(loan.getCourseDurationYears() * 365L, ChronoUnit.DAYS);
            loan.setCourseCompletionDate(courseEndDate);
            loan.setEmiStartDate(courseEndDate.plus(loan.getMoratoriumPeriodMonths() * 30L, ChronoUnit.DAYS));
        }

        studentLoanRepository.save(loan);
    }

//    public void disburseLoan(Long loanId, BigDecimal disbursementAmount) {
//        StudentLoan loan = studentLoanRepository.findById(loanId)
//                .orElseThrow(() -> new RuntimeException("Loan not found"));
//
//        if (!loan.isApproved() && !loan.isDisbursed()) {
//            throw new RuntimeException("Loan is not approved for disbursement");
//        }
//
//        if (loan.getAccount() != null) {
//            Account account = loan.getAccount();
//            account.setBalance(account.getBalance().add(disbursementAmount));
//            accountRepository.save(account);
//        }
//
//        loan.setStatus("DISBURSED");
//        if (loan.getDisbursementDate() == null) {
//            loan.setDisbursementDate(Instant.now());
//        }
//
//        // Update next disbursement if applicable
//        BigDecimal remainingAmount = loan.getOutstandingAmount().subtract(disbursementAmount);
//        if (remainingAmount.compareTo(BigDecimal.ZERO) > 0) {
//            loan.setNextDisbursementAmount(remainingAmount);
//            loan.setNextDisbursementDate(Instant.now().plus(180, ChronoUnit.DAYS)); // Next semester
//        } else {
//            loan.setNextDisbursementAmount(null);
//            loan.setNextDisbursementDate(null);
//            loan.setStatus("ACTIVE");
//
//            // Set EMI start date after course completion + moratorium period
//            Instant courseEndDate = Instant.now().plus(loan.getCourseDurationYears() * 365L, ChronoUnit.DAYS);
//            loan.setCourseCompletionDate(courseEndDate);
//            loan.setEmiStartDate(courseEndDate.plus(loan.getMoratoriumPeriodMonths() * 30L, ChronoUnit.DAYS));
//        }
//
//        studentLoanRepository.save(loan);
//    }

    public void renewLoan(Long loanId, BigDecimal additionalAmount, Integer newTenure) {
        StudentLoan loan = studentLoanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        if (!loan.isActive()) {
            throw new RuntimeException("Only active loans can be renewed");
        }

        BigDecimal newLoanAmount = loan.getOutstandingAmount().add(additionalAmount);
        BigDecimal newEmi = calculateEMI(newLoanAmount, loan.getInterestRate(), newTenure);

        loan.setLoanAmount(newLoanAmount);
        loan.setOutstandingAmount(newLoanAmount);
        loan.setTenureMonths(newTenure);
        loan.setMonthlyEmi(newEmi);

        studentLoanRepository.save(loan);
    }

    public void closeLoan(Long loanId, Long customerId) {
        StudentLoan loan = studentLoanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        if (!loan.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Access denied: Loan does not belong to user");
        }

        if (loan.getOutstandingAmount().compareTo(BigDecimal.ZERO) > 0) {
            throw new RuntimeException("Cannot close loan with outstanding amount");
        }

        loan.setStatus("CLOSED");
        studentLoanRepository.save(loan);
    }

    public Page<StudentLoanDto> getAllLoans(String status, Pageable pageable) {
        Page<StudentLoan> loans;
        if (status != null && !status.isEmpty()) {
            loans = studentLoanRepository.findByStatusOrderByApplicationDateDesc(status, pageable);
        } else {
            loans = studentLoanRepository.findAllByOrderByApplicationDateDesc(pageable);
        }
        return loans.map(this::convertToDto);
    }

    public List<LoanInstallmentDto> getLoanInstallments(Long loanId, Long customerId) {
        StudentLoan loan = studentLoanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        if (!loan.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Access denied: Loan does not belong to user");
        }

        List<LoanInstallment> installments = installmentRepository.findByLoanIdOrderByDueDateDesc(loanId);
        return installments.stream().map(this::convertInstallmentToDto).collect(Collectors.toList());
    }

    public void payInstallment(Long loanId, BigDecimal amount, Long customerId) {
        StudentLoan loan = studentLoanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        if (!loan.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Access denied: Loan does not belong to user");
        }
        if (!loan.isDisbursed() && !loan.isActive()) {
            throw new RuntimeException("Installment cannot be paid: Loan not yet disbursed or not active");
        }
        if (loan.getEmiStartDate() == null || Instant.now().isBefore(loan.getEmiStartDate())) {
            throw new RuntimeException("Installment cannot be paid before EMI start date");
        }

        BigDecimal monthlyEmi = loan.getMonthlyEmi();
        BigDecimal outstanding = loan.getOutstandingAmount();

        if (outstanding.compareTo(monthlyEmi) > 0) {
            if (amount.compareTo(monthlyEmi) != 0) {
                throw new RuntimeException("Installment amount must equal monthly EMI: " + monthlyEmi);
            }
        } else {
            // Last installment: must pay exactly the remaining outstanding
            if (amount.compareTo(outstanding) != 0) {
                throw new RuntimeException("Final installment must equal outstanding amount: " + outstanding);
            }
        }

        int nextInstallmentNumber = installmentRepository.countByLoanId(loanId) + 1;
        // Create installment record
        LoanInstallment installment = LoanInstallment.builder()
                .loanId(loanId)
                .amount(amount)
                .paidDate(Instant.now())
                .dueDate(Instant.now())
                .status("PAID")
                .createdAt(Instant.now())
                .build();


        installmentRepository.save(installment);

        // Update outstanding amount
        BigDecimal newOutstanding = loan.getOutstandingAmount().subtract(amount);
        loan.setOutstandingAmount(newOutstanding);

        if (newOutstanding.compareTo(BigDecimal.ZERO) <= 0) {
            loan.setStatus("CLOSED");
        }

        studentLoanRepository.save(loan);
    }

    private BigDecimal calculateEMI(BigDecimal principal, BigDecimal annualRate, Integer tenureMonths) {
        BigDecimal monthlyRate = annualRate.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
        BigDecimal numerator = principal.multiply(monthlyRate).multiply(onePlusR.pow(tenureMonths));
        BigDecimal denominator = onePlusR.pow(tenureMonths).subtract(BigDecimal.ONE);
        return numerator.divide(denominator, 2, RoundingMode.HALF_UP);
    }

    private StudentLoanDto convertToDto(StudentLoan loan) {
        return StudentLoanDto.builder()
                .id(loan.getId())
                .customerId(loan.getCustomer().getId())
                .customerName(loan.getCustomer().getName())
                .customerEmail(loan.getCustomer().getEmail())
                .accountId(loan.getAccount() != null ? loan.getAccount().getId() : null) // Added account ID to DTO
                .accountNumber(loan.getAccount() != null ? loan.getAccount().getAccountNumber() : null) // Added account number to DTO
                .loanAmount(loan.getLoanAmount())
                .interestRate(loan.getInterestRate())
                .tenureMonths(loan.getTenureMonths())
                .monthlyEmi(loan.getMonthlyEmi())
                .courseName(loan.getCourseName())
                .institutionName(loan.getInstitutionName())
                .courseDurationYears(loan.getCourseDurationYears())
                .courseFee(loan.getCourseFee())
                .academicYear(loan.getAcademicYear())
                .studentName(loan.getStudentName())
                .studentAge(loan.getStudentAge())
                .guardianName(loan.getGuardianName())
                .guardianIncome(loan.getGuardianIncome())
                .collateralProvided(loan.getCollateralProvided())
                .collateralDetails(loan.getCollateralDetails())
                .status(loan.getStatus())
                .moratoriumPeriodMonths(loan.getMoratoriumPeriodMonths())
                .applicationDate(loan.getApplicationDate())
                .approvalDate(loan.getApprovalDate())
                .disbursementDate(loan.getDisbursementDate())
                .courseCompletionDate(loan.getCourseCompletionDate())
                .emiStartDate(loan.getEmiStartDate())
                .outstandingAmount(loan.getOutstandingAmount())
                .disbursementType(loan.getDisbursementType())
                .nextDisbursementAmount(loan.getNextDisbursementAmount())
                .nextDisbursementDate(loan.getNextDisbursementDate())
                .rejectionReason(loan.getRejectionReason())
                .build();
    }

    private LoanInstallmentDto convertInstallmentToDto(LoanInstallment installment) {
        return LoanInstallmentDto.builder()
                .id(installment.getId())
                .loanId(installment.getLoanId())
                .amount(installment.getAmount())
                .dueDate(installment.getDueDate())
                .paidDate(installment.getPaidDate())
                .status(installment.getStatus())
                .build();
    }
}
