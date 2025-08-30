package com.example.bankingmini.account;

import com.example.bankingmini.account.AccountDtos.*;
import com.example.bankingmini.auth.CustomerRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService service;
    private final AccountQueryService queries;
    private final StatementService statements;
    private final CustomerRepository customerRepository;

    private Long requireUser() {
        // 1️⃣ Get Authentication object from SecurityContext
        var auth = SecurityContextHolder.getContext().getAuthentication();

        // 2️⃣ Check if the user is authenticated
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            throw new IllegalArgumentException("Not authenticated");
        }
        // 3️⃣ Extract principal (email in your filter case)
        String email = (String) auth.getPrincipal();

        // 4️⃣ Look up the userId from DB (since you're not storing userId in Authentication)
        var customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return customer.getId();
    }


    @PostMapping("/create")
    public CreateAccountResponse createAccount(@Valid @RequestBody CreateAccountRequest req, HttpServletRequest request) {
        Long customerId = requireUser();
//        Long customerId = requireUser(request);
        var account = service.createAccount(customerId, req.accountType());
        return new CreateAccountResponse(
                account.getAccountNumber(),
                req.accountType(),
                account.getBalance(),
                account.getStatus()
        );
    }

    @PostMapping("/deposit")
    public void deposit(@Valid @RequestBody MoneyRequest req, HttpServletRequest request) {
        Long userId = requireUser();
        service.deposit(req.accountNumber(), req.amount(), userId);
    }

    @PostMapping("/withdraw")
    public void withdraw(@Valid @RequestBody MoneyRequest req, HttpServletRequest request) {
        Long userId = requireUser();
        service.withdraw(req.accountNumber(), req.amount(), userId);
    }

    @PostMapping("/transfer")
    public void transfer(@Valid @RequestBody TransferRequest req, HttpServletRequest request) {
        Long userId = requireUser();
        service.transfer(req.fromAccount(), req.toAccount(), req.amount(), userId);
    }

    @GetMapping("/balance")
    public BalanceResponse balance(@RequestParam("accountNumber") String accountNumber, HttpServletRequest request) {
        Long userId = requireUser();
        var bal = queries.getBalance(accountNumber, userId);
        return new BalanceResponse(accountNumber, bal);
    }

    @GetMapping("/mini-statement")
    public MiniStatementResponse mini(@RequestParam("accountNumber") String accountNumber, HttpServletRequest request) {
        Long userId = requireUser();
        var last5 = queries.last5(accountNumber, userId);
        return new MiniStatementResponse(accountNumber, last5);
    }

    @PostMapping("/statement")
    public AccountDtos.StatementResponse statement(@Valid @RequestBody
                                                   AccountDtos.StatementRequest req, HttpServletRequest request) {
        Long userId = requireUser();
        return statements.generate(req, userId);
    }

    @GetMapping("/list")
    public List<AccountSummaryDto> getCustomerAccounts() {
        Long customerId = requireUser();
        var accounts = service.getCustomerAccounts(customerId);
        return accounts.stream()
                .map(account -> new AccountSummaryDto(
                        account.getId(),
                        account.getAccountNumber(),
                        account.getBalance(),
//                        account.getAccountType(),
                        account.getStatus()
                ))
                .collect(java.util.stream.Collectors.toList());

    }
}