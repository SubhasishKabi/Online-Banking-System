package com.example.bankingmini.auth;

import com.example.bankingmini.auth.AuthDtos.*;
import com.example.bankingmini.auth.JwtAuthDtos.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpirationMs;

    @PostMapping("/register")
    public JwtAuthResponse register(@Valid @RequestBody RegisterRequest req) {
        var customer = authService.register(req.email(), req.password(), req.name());

        String accessToken = jwtUtil.generateAccessToken(customer.getId(), customer.getEmail(), customer.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(customer.getId(), customer.getEmail());

        UserInfo userInfo = new UserInfo(customer.getId(), customer.getEmail(), customer.getName(), customer.getRole());

        return new JwtAuthResponse(accessToken, refreshToken, jwtExpirationMs / 1000, userInfo);
    }

    @PostMapping("/register-admin")
    public JwtAuthResponse registerAdmin(@Valid @RequestBody RegisterRequest req) {
        var customer = authService.registerAdmin(req.email(), req.password(), req.name());

        String accessToken = jwtUtil.generateAccessToken(customer.getId(), customer.getEmail(), customer.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(customer.getId(), customer.getEmail());

        UserInfo userInfo = new UserInfo(customer.getId(), customer.getEmail(), customer.getName(), customer.getRole());

        return new JwtAuthResponse(accessToken, refreshToken, jwtExpirationMs / 1000, userInfo);
    }

    @PostMapping("/register-loan-officer")
    public JwtAuthResponse registerLoanOfficer(@Valid @RequestBody RegisterRequest req) {
        var customer = authService.registerLoanOfficer(req.email(), req.password(), req.name());

        String accessToken = jwtUtil.generateAccessToken(customer.getId(), customer.getEmail(), customer.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(customer.getId(), customer.getEmail());

        UserInfo userInfo = new UserInfo(customer.getId(), customer.getEmail(), customer.getName(), customer.getRole());

        return new JwtAuthResponse(accessToken, refreshToken, jwtExpirationMs / 1000, userInfo);
    }

    @PostMapping("/login")
    public JwtAuthResponse login(@Valid @RequestBody LoginRequest req) {
        var customer = authService.authenticate(req.email(), req.password());

        String accessToken = jwtUtil.generateAccessToken(customer.getId(), customer.getEmail(), customer.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(customer.getId(), customer.getEmail());

        UserInfo userInfo = new UserInfo(customer.getId(), customer.getEmail(), customer.getName(), customer.getRole());

        return new JwtAuthResponse(accessToken, refreshToken, jwtExpirationMs / 1000, userInfo);
    }

    @PostMapping("/refresh")
    public RefreshTokenResponse refresh(@Valid @RequestBody RefreshTokenRequest req) {
        String refreshToken = req.refreshToken();

        if (!jwtUtil.isTokenValid(refreshToken) || !jwtUtil.isRefreshToken(refreshToken)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }

        String email = jwtUtil.getEmailFromToken(refreshToken);
        Long userId = jwtUtil.getUserIdFromToken(refreshToken);

        // Verify user still exists
        var customer = authService.findByEmail(email);
        if (customer == null || !customer.getId().equals(userId)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }

        String newAccessToken = jwtUtil.generateAccessToken(customer.getId(), customer.getEmail(), customer.getRole());

        return new RefreshTokenResponse(newAccessToken, jwtExpirationMs / 1000);
    }

    @PostMapping("/logout")
    public void logout() {
        // With JWT, logout is handled client-side by removing the token
        // Server-side token blacklisting could be implemented here if needed
    }

    @GetMapping("/me")
    public UserInfo me() {
        // 1️⃣ Get Authentication object from SecurityContext
        var auth = SecurityContextHolder.getContext().getAuthentication();

        // 2️⃣ Check if user is authenticated
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            throw new IllegalArgumentException("Not authenticated");
        }

        // 3️⃣ Get user email from principal
        String email = (String) auth.getPrincipal();

        // 4️⃣ Fetch customer from authService
        var customer = authService.findByEmail(email);
        if (customer == null) {
            throw new IllegalArgumentException("User not found");
        }

        // 5️⃣ Return user info
        return new UserInfo(customer.getId(), customer.getEmail(), customer.getName(), customer.getRole());
    }


}
