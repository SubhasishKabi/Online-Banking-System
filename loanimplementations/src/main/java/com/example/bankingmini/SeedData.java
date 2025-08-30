//package com.example.bankingmini;
//
//import com.example.bankingmini.auth.Customer;
//import com.example.bankingmini.auth.CustomerRepository;
//import com.example.bankingmini.account.Account;
//import com.example.bankingmini.account.AccountRepository;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.security.crypto.password.PasswordEncoder;
//
//import java.math.BigDecimal;
//import java.time.Instant;
//import java.time.OffsetDateTime;
//import java.time.ZoneOffset;
//
//@Configuration
//public class SeedData {
//
//    @Bean
//    CommandLineRunner seed(CustomerRepository customers, AccountRepository accounts, PasswordEncoder enc) {
//        return args -> {
//            if (customers.count() == 0) {
//                // ✅ Create demo USER
//                var demo = Customer.builder()
//                        .email("demo@example.com")
//                        .passwordHash(enc.encode("Demo@1234"))
//                        .name("Demo User")
//                        .role("USER")
//                        .createdAt(Instant.now())
//                        .build();
//
//                demo = customers.save(demo); // ID generated via CUSTOMER_SEQ
//
//                var now = OffsetDateTime.now(ZoneOffset.UTC);
//
//                var acc1 = Account.builder()
//                        .customer(demo)
//                        .accountNumber("ACC1001")
//                        .balance(new BigDecimal("5000.00"))
//                        .status("ACTIVE")
//                        .createdAt(now)
//                        .build();
//
//                var acc2 = Account.builder()
//                        .customer(demo)
//                        .accountNumber("ACC1002")
//                        .balance(new BigDecimal("2000.00"))
//                        .status("ACTIVE")
//                        .createdAt(now)
//                        .build();
//
//                accounts.save(acc1);
//                accounts.save(acc2);
//
//                // ✅ Optional: create a default ADMIN
//                if (customers.findByEmail("admin@example.com").isEmpty()) {
//                    var admin = Customer.builder()
//                            .email("admin@example.com")
//                            .passwordHash(enc.encode("Admin@1234"))
//                            .name("Admin User")
//                            .role("ADMIN")
//                            .createdAt(Instant.now())
//                            .build();
//
//                    customers.save(admin);
//                }
//
//            } else {
//                // ✅ Ensure existing users have a default role
//                customers.findAll().forEach(c -> {
//                    if (c.getRole() == null) {
//                        c.setRole("USER");
//                        customers.save(c);
//                    }
//                });
//            }
//        };
//    }
//}
