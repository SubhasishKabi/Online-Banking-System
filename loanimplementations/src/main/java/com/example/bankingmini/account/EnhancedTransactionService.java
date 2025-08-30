package com.example.bankingmini.account;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class EnhancedTransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AccountRepository accountRepository;

    public Page<TransactionDto> getTransactionHistory(Long accountId, Long userId, Pageable pageable) {
        validateAccountOwnership(accountId, userId);
        Page<TransactionEntity> transactions = transactionRepository.findByAccountIdOrderByOccurredAtDesc(accountId, pageable);
        return transactions.map(this::convertToDto);
    }


    public Page<TransactionDto> searchTransactions(TransactionSearchCriteria criteria, Long userId, Pageable pageable) {
        validateAccountOwnership(criteria.getAccountId(), userId);
        
        Page<TransactionEntity> transactions;
        
        if (criteria.getStartDate() != null && criteria.getEndDate() != null) {
            transactions = transactionRepository.findByAccountIdAndDateRange(
                criteria.getAccountId(), criteria.getStartDate(), criteria.getEndDate(), pageable);
        } else if (criteria.getMinAmount() != null && criteria.getMaxAmount() != null) {
            transactions = transactionRepository.findByAccountIdAndAmountRange(
                criteria.getAccountId(), criteria.getMinAmount(), criteria.getMaxAmount(), pageable);
        } else if (criteria.getType() != null) {
            transactions = transactionRepository.findByAccountIdAndTypeOrderByOccurredAtDesc(
                criteria.getAccountId(), criteria.getType(), pageable);
        } else if (criteria.getCategory() != null) {
            transactions = transactionRepository.findByAccountIdAndCategoryOrderByOccurredAtDesc(
                criteria.getAccountId(), criteria.getCategory(), pageable);
        } else {
            transactions = transactionRepository.findByAccountIdOrderByOccurredAtDesc(criteria.getAccountId(), pageable);
        }
        
        return transactions.map(this::convertToDto);
    }

    public void updateTransactionDescription(Long transactionId, String description, Long userId) {
        TransactionEntity transaction = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new RuntimeException("Transaction not found"));
        
        validateAccountOwnership(transaction.getAccount().getId(), userId);
        transaction.setDescription(description);
        transactionRepository.save(transaction);
    }

    public void updateTransactionCategory(Long transactionId, String category, Long userId) {
        TransactionEntity transaction = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new RuntimeException("Transaction not found"));
        
        validateAccountOwnership(transaction.getAccount().getId(), userId);
        transaction.setCategory(category);
        transactionRepository.save(transaction);
    }

    private void validateAccountOwnership(Long accountId, Long userId) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new RuntimeException("Account not found"));
        
        if (!account.getCustomer().getId().equals(userId)) {
            throw new RuntimeException("Access denied: Account does not belong to user");
        }
    }

    private TransactionDto convertToDto(TransactionEntity transaction) {
        return TransactionDto.builder()
            .id(transaction.getId())
            .accountId(transaction.getAccount().getId())
            .type(transaction.getType())
            .amount(transaction.getAmount())
            .refAccountId(transaction.getRefAccountId())
            .description(transaction.getDescription())
            .category(transaction.getCategory())
            .occurredAt(transaction.getOccurredAt())
            .build();
    }
}
