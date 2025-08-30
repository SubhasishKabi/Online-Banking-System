package com.example.bankingmini.loan;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface StudentLoanRepository extends JpaRepository<StudentLoan, Long> {
    
    List<StudentLoan> findByCustomerIdOrderByApplicationDateDesc(Long customerId);
    
    Page<StudentLoan> findByCustomerIdOrderByApplicationDateDesc(Long customerId, Pageable pageable);
    
    Page<StudentLoan> findByStatusOrderByApplicationDateDesc(String status, Pageable pageable);
    
    Page<StudentLoan> findAllByOrderByApplicationDateDesc(Pageable pageable);
    
    @Query("SELECT s FROM StudentLoan s WHERE s.status = 'PENDING' ORDER BY s.applicationDate ASC")
    List<StudentLoan> findPendingLoansForProcessing();
    
    @Query("SELECT s FROM StudentLoan s WHERE s.customer.id = :customerId AND s.status IN ('APPROVED', 'DISBURSED', 'ACTIVE')")
    List<StudentLoan> findActiveLoansForCustomer(@Param("customerId") Long customerId);
    
    @Query("SELECT s FROM StudentLoan s WHERE s.status = 'DISBURSED' AND s.nextDisbursementDate <= :currentDate")
    List<StudentLoan> findLoansForNextDisbursement(@Param("currentDate") Instant currentDate);
    
    @Query("SELECT s FROM StudentLoan s WHERE s.status = 'ACTIVE' AND s.emiStartDate <= :currentDate")
    List<StudentLoan> findLoansForEMICollection(@Param("currentDate") Instant currentDate);
}
