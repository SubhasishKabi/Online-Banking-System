package com.example.bankingmini.auth;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    @Test
    void register_enforces_password_rules_and_uniqueness() {
        var repo = mock(CustomerRepository.class);
        var svc = new AuthService(repo, new BCryptPasswordEncoder(12));

        // unique email
        when(repo.findByEmail("x@y.com")).thenReturn(Optional.empty());
        when(repo.save(Mockito.any())).thenAnswer(i -> i.getArguments()[0]);

        var c = svc.register("x@y.com", "Abcdefg1", "User");
        assertNotNull(c.getPasswordHash());

        // duplicate
        when(repo.findByEmail("dup@y.com")).thenReturn(Optional.of(new Customer()));
        assertThrows(IllegalArgumentException.class,
                () -> svc.register("dup@y.com", "Abcdefg1", "User"));

        // weak password
        assertThrows(IllegalArgumentException.class,
                () -> svc.register("w@y.com", "weak", "User"));
    }
}
