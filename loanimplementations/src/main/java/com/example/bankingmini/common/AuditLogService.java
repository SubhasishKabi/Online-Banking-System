package com.example.bankingmini.common;

import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;

@Service
@Slf4j
public class AuditLogService {

    public void logLoanAction(String action, Long loanId, String loanType, String details) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth != null ? auth.getName() : "SYSTEM";
        
        log.info("AUDIT_LOG: User={}, Action={}, LoanType={}, LoanId={}, Details={}, Timestamp={}", 
                userEmail, action, loanType, loanId, details, Instant.now());
    }

    public void logTransactionAction(String action, Long accountId, String details) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth != null ? auth.getName() : "SYSTEM";
        
        log.info("AUDIT_LOG: User={}, Action={}, AccountId={}, Details={}, Timestamp={}", 
                userEmail, action, accountId, details, Instant.now());
    }

    public void logProfileAction(String action, Long customerId, String details) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth != null ? auth.getName() : "SYSTEM";
        
        log.info("AUDIT_LOG: User={}, Action={}, CustomerId={}, Details={}, Timestamp={}", 
                userEmail, action, customerId, details, Instant.now());
    }

    public void logSecurityEvent(String event, String details) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth != null ? auth.getName() : "ANONYMOUS";
        
        log.warn("SECURITY_LOG: User={}, Event={}, Details={}, Timestamp={}", 
                userEmail, event, details, Instant.now());
    }
}
