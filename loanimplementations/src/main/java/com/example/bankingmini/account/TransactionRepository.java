package com.example.bankingmini.account;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface TransactionRepository extends JpaRepository<TransactionEntity, Long> {
    
    List<TransactionEntity> findTop5ByAccountOrderByOccurredAtDesc(Account account);
    List<TransactionEntity> findByAccountAndOccurredAtBetweenOrderByOccurredAtAsc(
            Account account, Instant from, Instant to
    );
    List<TransactionEntity> findByAccountAndOccurredAtBeforeOrderByOccurredAtAsc(
            Account account, Instant before
    );
    
    Page<TransactionEntity> findByAccountIdOrderByOccurredAtDesc(Long accountId, Pageable pageable);
    
    List<TransactionEntity> findTop10ByAccountIdOrderByOccurredAtDesc(Long accountId);
    
    @Query("SELECT t FROM TransactionEntity t WHERE t.account.id = :accountId AND t.occurredAt BETWEEN :startDate AND :endDate ORDER BY t.occurredAt DESC")
    Page<TransactionEntity> findByAccountIdAndDateRange(@Param("accountId") Long accountId, 
                                                       @Param("startDate") Instant startDate, 
                                                       @Param("endDate") Instant endDate, 
                                                       Pageable pageable);
    
    @Query("SELECT t FROM TransactionEntity t WHERE t.account.id = :accountId AND t.amount BETWEEN :minAmount AND :maxAmount ORDER BY t.occurredAt DESC")
    Page<TransactionEntity> findByAccountIdAndAmountRange(@Param("accountId") Long accountId, 
                                                         @Param("minAmount") BigDecimal minAmount, 
                                                         @Param("maxAmount") BigDecimal maxAmount, 
                                                         Pageable pageable);
    
    Page<TransactionEntity> findByAccountIdAndTypeOrderByOccurredAtDesc(Long accountId, String type, Pageable pageable);
    
    Page<TransactionEntity> findByAccountIdAndCategoryOrderByOccurredAtDesc(Long accountId, String category, Pageable pageable);
}
