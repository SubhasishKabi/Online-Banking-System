//package com.example.bankingmini.loan;
//
//import com.example.bankingmini.auth.Customer;
//import com.example.bankingmini.auth.CustomerRepository;
//import com.example.bankingmini.loan.LoanDtos.*;
//import jakarta.servlet.http.HttpServletRequest;
//import lombok.RequiredArgsConstructor;
//import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.List;
//import java.util.stream.Collectors;
//
//@RestController
//@RequestMapping("/api/admin/loan")
//@RequiredArgsConstructor
//public class AdminLoanController {
//    private final LoanService service;
//    private final CustomerRepository customers;
//    private final CustomerRepository customerRepository;
//
//
//    //    private Customer requireAdmin(HttpServletRequest request) {
////        var uid = (Long) request.getAttribute("userId");
////        var role = (String) request.getAttribute("userRole");
////        if (uid == null) throw new IllegalArgumentException("Not authenticated");
////        if (!"ADMIN".equals(role)) throw new IllegalArgumentException("Admin access required");
////        return customers.findById(uid).orElseThrow();
////    }
//    private Customer requireAdmin() {
//        var auth = SecurityContextHolder.getContext().getAuthentication();
//
//        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
//            throw new IllegalArgumentException("Not authenticated");
//        }
//        boolean isAdmin = auth.getAuthorities().stream()
//                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
//        if (!isAdmin) throw new IllegalArgumentException("Admin access required");
//
//        String email = (String) auth.getPrincipal();
//        return customerRepository.findByEmail(email)
//                .orElseThrow(() -> new IllegalArgumentException("User not found"));
//    }
//
//
//    @PostMapping("/{id}/approve")
//    @PreAuthorize("hasRole('ADMIN')")
//    public LoanResponse approve(@PathVariable("id") Long id, HttpServletRequest request) {
//        var admin = requireAdmin();
////        var admin = requireAdmin(request);
//        var loan = service.approve(id, admin);
//        return new LoanResponse(
//                loan.getId(), loan.getStatus(), loan.getApprovedAt(),
//                loan.getType(), loan.getPrincipal(), loan.getInterestRate(), loan.getTenureMonths()
//        );
//    }
//
//    @PostMapping("/{id}/reject")
//    @PreAuthorize("hasRole('ADMIN')")
//    public LoanResponse reject(@PathVariable("id") Long id, HttpServletRequest request) {
//        var admin = requireAdmin();
////        var admin = requireAdmin(request);
//        var loan = service.reject(id, admin);
//        return new LoanResponse(
//                loan.getId(), loan.getStatus(), loan.getApprovedAt(),
//                loan.getType(), loan.getPrincipal(), loan.getInterestRate(), loan.getTenureMonths()
//        );
//    }
//
//    @GetMapping("/all")
//    @PreAuthorize("hasRole('ADMIN')")
//    public List<LoanResponse> getAllLoans(HttpServletRequest request) {
//        var admin = requireAdmin();
////        var admin = requireAdmin(request);
//        return service.getAllLoans(admin).stream()
//                .map(loan -> new LoanResponse(
//                        loan.getId(), loan.getStatus(), loan.getApprovedAt(),
//                        loan.getType(), loan.getPrincipal(), loan.getInterestRate(), loan.getTenureMonths()
//                ))
//                .collect(Collectors.toList());
//    }
//
//    @GetMapping("/{id}")
//    @PreAuthorize("hasRole('ADMIN')")
//    public LoanResponse getLoanById(@PathVariable("id") Long id, HttpServletRequest request) {
//        var admin = requireAdmin();
////        var admin = requireAdmin(request);
//        var loan = service.getLoanById(id, admin);
//        return new LoanResponse(
//                loan.getId(), loan.getStatus(), loan.getApprovedAt(),
//                loan.getType(), loan.getPrincipal(), loan.getInterestRate(), loan.getTenureMonths()
//        );
//    }
//
//    @GetMapping("/pending")
//    @PreAuthorize("hasRole('ADMIN')")
//    public List<LoanResponse> getPendingLoans(HttpServletRequest request) {
//        var admin = requireAdmin();
////        var admin = requireAdmin(request);
//        return service.getPendingLoans(admin).stream()
//                .map(loan -> new LoanResponse(
//                        loan.getId(), loan.getStatus(), loan.getApprovedAt(),
//                        loan.getType(), loan.getPrincipal(), loan.getInterestRate(), loan.getTenureMonths()
//                ))
//                .collect(Collectors.toList());
//    }
//}
