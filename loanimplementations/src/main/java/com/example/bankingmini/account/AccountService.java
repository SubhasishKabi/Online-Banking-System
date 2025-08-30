package com.example.bankingmini.account;

import com.example.bankingmini.auth.Customer;
import com.example.bankingmini.auth.CustomerRepository;
import com.example.bankingmini.common.InsufficientFundsException;
import com.example.bankingmini.common.NotFoundException;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accounts;
    private final TransactionRepository txns;
    private final CustomerRepository customers;

    @Transactional
    public Account createAccount(Long customerId, String accountType) {
        var customer = customers.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found: " + customerId));

        // Generate unique account number
        String accountNumber;
        do {
            accountNumber = generateAccountNumber();
        } while (accounts.findByAccountNumber(accountNumber).isPresent());

        var account = Account.builder()
                .id(System.currentTimeMillis() + new Random().nextInt(1_000))
                .customer(customer)
                .accountNumber(accountNumber)   // renamed from .number(...)
                .balance(BigDecimal.ZERO)
                .status("ACTIVE")
//                .createdAt(OffsetDateTime.from(Instant.now()))
                .createdAt(Instant.now().atOffset(ZoneOffset.UTC))
                .build();

        return accounts.save(account);
    }

    private String generateAccountNumber() {
        return "ACC" + System.currentTimeMillis() + String.format("%03d", new Random().nextInt(1000));
    }

    private Account findAndLockWithAuth(String accountNumber, Long userId) {
        var acc = accounts.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new NotFoundException("Account not found: " + accountNumber));

        // Verify the account belongs to the authenticated user
        if (!acc.getCustomer().getId().equals(userId)) {
            throw new IllegalArgumentException("Access denied: Account does not belong to user");
        }

        return acc;
    }

    private Account findAndLock(String number) {
        var acc = accounts.findByAccountNumber(number)
                .orElseThrow(() -> new NotFoundException("Account not found: " + number));
        // For Oracle, optimistic locking would need @Version; here we rely on TX boundary and row-level locks via updates.
        return acc;
    }

    @Transactional
    public void deposit(String accountNumber, BigDecimal amount, Long userId) {
        var acc = findAndLockWithAuth(accountNumber, userId);
        acc.setBalance(acc.getBalance().add(amount));
        accounts.save(acc);
        txns.save(TransactionEntity.builder()
                .account(acc)
                .type("DEPOSIT")
                .amount(amount)
                .occurredAt(Instant.now())
                .build());
    }

    @Transactional
    public void withdraw(String accountNumber, BigDecimal amount, Long userId) {
        var acc = findAndLockWithAuth(accountNumber, userId);
        if (acc.getBalance().compareTo(amount) < 0) {
            throw new InsufficientFundsException("Insufficient funds");
        }
        acc.setBalance(acc.getBalance().subtract(amount));
        accounts.save(acc);
        txns.save(TransactionEntity.builder()
                .account(acc)
                .type("WITHDRAW")
                .amount(amount)
                .occurredAt(Instant.now())
                .build());
    }

    @Transactional
    public void transfer(String from, String to, BigDecimal amount, Long userId) {
        if (from.equals(to)) throw new IllegalArgumentException("Cannot transfer to same account");

        var a = findAndLockWithAuth(from, userId);
        // Destination account can belong to any user (for transfers between users)
        var b = findAndLock(to);

        if (a.getBalance().compareTo(amount) < 0) {
            throw new InsufficientFundsException("Insufficient funds");
        }
        a.setBalance(a.getBalance().subtract(amount));
        b.setBalance(b.getBalance().add(amount));
        accounts.save(a);
        accounts.save(b);
        txns.save(TransactionEntity.builder()
                .account(a).type("TRANSFER_OUT").amount(amount).refAccountId(b.getId()).occurredAt(Instant.now()).build());
        txns.save(TransactionEntity.builder()
                .account(b).type("TRANSFER_IN").amount(amount).refAccountId(a.getId()).occurredAt(Instant.now()).build());
    }

    @Deprecated
    public void deposit(String accountNumber, BigDecimal amount) {
        throw new IllegalArgumentException("Unauthorized access: User ID required");
    }

    @Deprecated
    public void withdraw(String accountNumber, BigDecimal amount) {
        throw new IllegalArgumentException("Unauthorized access: User ID required");
    }

    @Deprecated
    public void transfer(String from, String to, BigDecimal amount) {
        throw new IllegalArgumentException("Unauthorized access: User ID required");
    }
    public List<Account> getCustomerAccounts(Long customerId) {
        return accounts.findByCustomerId(customerId);
    }
}
