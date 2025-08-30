package com.example.bankingmini.auth;

import com.example.bankingmini.common.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CustomerRepository customers;
    private final PasswordEncoder passwordEncoder;

    private static final Pattern PWD_PATTERN =
            Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$");

    public Customer register(String email, String password, String name) {
        if (!PWD_PATTERN.matcher(password).matches()) {
            throw new IllegalArgumentException("Password must be 8+ chars with upper, lower, digit");
        }
        customers.findByEmail(email).ifPresent(c -> {
            throw new IllegalArgumentException("Email already registered");
        });
        var c = Customer.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .name(name)
                .role("USER") // Default role is USER
                .createdAt(Instant.now())
                .build();
        return customers.save(c);
    }

    public Customer registerAdmin(String email, String password, String name) {
        if (!PWD_PATTERN.matcher(password).matches()) {
            throw new IllegalArgumentException("Password must be 8+ chars with upper, lower, digit");
        }
        customers.findByEmail(email).ifPresent(c -> {
            throw new IllegalArgumentException("Email already registered");
        });
        var c = Customer.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .name(name)
                .role("ADMIN")
                .createdAt(Instant.now())
                .build();
        return customers.save(c);
    }

    public Customer registerLoanOfficer(String email, String password, String name) {
        if (!PWD_PATTERN.matcher(password).matches()) {
            throw new IllegalArgumentException("Password must be 8+ chars with upper, lower, digit");
        }
        customers.findByEmail(email).ifPresent(c -> {
            throw new IllegalArgumentException("Email already registered");
        });
        var c = Customer.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .name(name)
                .role("LOAN_OFFICER")
                .createdAt(Instant.now())
                .build();
        return customers.save(c);
    }

    public Customer authenticate(String email, String rawPassword) {
        var user = customers.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        return user;
    }

    public Customer findByEmail(String email) {
        return customers.findByEmail(email).orElse(null);
    }

    public Customer findById(Long id) {
        return customers.findById(id).orElse(null);
    }
}
