package com.example.bankingmini.security;

import com.example.bankingmini.repository.CustomerRepository;
import com.example.bankingmini.util.JwtUtil;
import com.example.bankingmini.model.Customer;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomerRepository customerRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        try {
            String jwt = getJwtFromRequest(request);
            
            if (StringUtils.hasText(jwt) && jwtUtil.isTokenValid(jwt)) {
                String email = jwtUtil.getEmailFromToken(jwt);
                Long userId = jwtUtil.getUserIdFromToken(jwt);
                String role = jwtUtil.getRoleFromToken(jwt);
                
                // Verify user still exists in database
                Customer customer = customerRepository.findById(userId).orElse(null);
                if (customer != null && customer.getEmail().equals(email)) {
                    
                    // Create authorities based on role
                    List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_" + role)
                    );
                    //we are not authenticating using password and username here, this has been done while logging in
                    //unlike the other method where the authentication manager authenticates(see below)
                    //Because you're authenticating using a JWT, not a username/password.
                    //
                    //The password was already verified when the user logged in. At this point, Spring doesn't need the user's password again.

                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(email, null, authorities);
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    //SecurityContextHolder is a Spring Security class that stores the authentication information of the current request/user.
                }
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
        }
        
        filterChain.doFilter(request, response);//passes the request to next filter
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}


//Authentication authentication = authenticationManager
//        .authenticate(
//                new UsernamePasswordAuthenticationToken(
//                        user.getUsername(),
//                        user.getPassword()
//                )
//        );
//
//if (authentication.isAuthenticated())
//        return "Success";
//        else
//        return "Login Failed";

//AuthenticationManager
//        ↓
//DaoAuthenticationProvider
//        ↓
//UserDetailsService
//        ↓
//Database