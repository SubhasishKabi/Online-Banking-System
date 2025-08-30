package com.example.bankingmini.loan;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    //    List<Loan> findAllByOrderByCreatedAtDesc();
    Page<Loan> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Loan> findByStatus(String status);

    List<Loan> findByCustomerId(Long customerId);

    List<Loan> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    //    Page<Loan> findByStatusOrderByApplicationDateDesc(String status, Pageable pageable);
    Page<Loan> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);


}
