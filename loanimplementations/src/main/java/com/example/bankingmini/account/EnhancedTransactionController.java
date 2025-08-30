package com.example.bankingmini.account;

import com.example.bankingmini.auth.Customer;
import com.example.bankingmini.common.RoleBasedAccessControl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class EnhancedTransactionController {

    @Autowired
    private EnhancedTransactionService transactionService;

    @Autowired
    private RoleBasedAccessControl accessControl;

    @GetMapping("/history")
    public ResponseEntity<Page<TransactionDto>> getTransactionHistory(
            @RequestParam("accountId") Long accountId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        Customer user = accessControl.getCurrentUser();//checks if someone is logged in or not
        Pageable pageable = PageRequest.of(page, size);//creates a PageRequest object that implements the Pageable interface
        Page<TransactionDto> transactions = transactionService.getTransactionHistory(accountId, user.getId(), pageable);
        return ResponseEntity.ok(transactions);
    }


    @GetMapping("/search")
    public ResponseEntity<Page<TransactionDto>> searchTransactions(
            @RequestParam("accountId") Long accountId,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "minAmount", required = false) BigDecimal minAmount,
            @RequestParam(value = "maxAmount", required = false) BigDecimal maxAmount,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        Customer user = accessControl.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        //Instead of passing 8 separate parameters to the service layer, you wrap them into a single object
        TransactionSearchCriteria criteria = TransactionSearchCriteria.builder()
                .accountId(accountId)
                .startDate(startDate != null ? Instant.parse(startDate) : null)
                .endDate(endDate != null ? Instant.parse(endDate) : null)
                .minAmount(minAmount)
                .maxAmount(maxAmount)
                .type(type)
                .category(category)
                .build();

        Page<TransactionDto> transactions = transactionService.searchTransactions(criteria, user.getId(), pageable);
        return ResponseEntity.ok(transactions);
    }

    @PutMapping("/{transactionId}/description")
    public ResponseEntity<String> updateTransactionDescription(
            @PathVariable("transactionId") Long transactionId,
            @RequestBody UpdateDescriptionRequest request) {

        Customer user = accessControl.getCurrentUser();
        transactionService.updateTransactionDescription(
                transactionId, request.getDescription(), user.getId()
        );
        return ResponseEntity.ok("Transaction description updated successfully");
    }


    @PutMapping("/{transactionId}/category")
    public ResponseEntity<String> updateTransactionCategory(
            @PathVariable("transactionId") Long transactionId,
            @RequestBody UpdateCategoryRequest request) {

        Customer user = accessControl.getCurrentUser();
        transactionService.updateTransactionCategory(transactionId, request.getCategory(), user.getId());
        return ResponseEntity.ok("Transaction category updated successfully");
    }

}
