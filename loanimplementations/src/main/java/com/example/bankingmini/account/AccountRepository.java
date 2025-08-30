package com.example.bankingmini.account;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByAccountNumber(String accountNumber);

    boolean existsByAccountNumber(String accountNumber);

    List<Account> findByCustomerId(Long customerId);
    
    List<Account> findByCustomerIdAndStatus(Long customerId, String status);
}

//In databases, a query might not find a matching row.
// Without Optional, you might return null, which can lead to NullPointerException.
//Optional makes it explicit that the result may be empty.
