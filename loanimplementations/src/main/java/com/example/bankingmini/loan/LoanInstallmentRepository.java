package com.example.bankingmini.loan;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LoanInstallmentRepository extends JpaRepository<LoanInstallment, Long> {
    
    List<LoanInstallment> findByLoanIdOrderByDueDateDesc(Long loanId);
    
    List<LoanInstallment> findByStatusOrderByDueDateAsc(String status);
    int countByLoanId(Long loanId);

}
