package com.example.bankingmini.loan;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VehicleLoanRepository extends JpaRepository<VehicleLoan, Long> {
    
    List<VehicleLoan> findByCustomerIdOrderByApplicationDateDesc(Long customerId);
    
    Page<VehicleLoan> findByCustomerIdOrderByApplicationDateDesc(Long customerId, Pageable pageable);
    
    Page<VehicleLoan> findByStatusOrderByApplicationDateDesc(String status, Pageable pageable);
    
    Page<VehicleLoan> findAllByOrderByApplicationDateDesc(Pageable pageable);
    
    @Query("SELECT v FROM VehicleLoan v WHERE v.status = 'PENDING' ORDER BY v.applicationDate ASC")
    List<VehicleLoan> findPendingLoansForProcessing();
    
    @Query("SELECT v FROM VehicleLoan v WHERE v.customer.id = :customerId AND v.status IN ('APPROVED', 'DISBURSED')")
    List<VehicleLoan> findActiveLoansForCustomer(@Param("customerId") Long customerId);
}
