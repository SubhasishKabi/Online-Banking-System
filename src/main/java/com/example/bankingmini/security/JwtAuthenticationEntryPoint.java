package com.example.bankingmini.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
//AuthenticationEntryPoint is a Spring Security interface that handles unauthenticated requests,
//  usually by returning a 401 Unauthorized response.
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {
    //Spring Security calls this method when authentication is required but hasn't been established.
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                        AuthenticationException authException) throws IOException {
        
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        Map<String, Object> body = new HashMap<>();
        body.put("status", HttpServletResponse.SC_UNAUTHORIZED);
        body.put("error", "Unauthorized");
        body.put("message", "Authentication required");
        body.put("path", request.getServletPath());

        ObjectMapper mapper = new ObjectMapper();
        mapper.writeValue(response.getOutputStream(), body);
        //objectMapper is a Jackson class used to convert between Java objects and JSON.
        //RowMapper is a Spring JDBC interface used to convert one row from a database ResultSet into one Java object.
    }
}
//When a user tries to access a protected API without being authenticated,
//this class sends a 401 Unauthorized JSON response instead of redirecting them to a login page.