package com.example.bankingmini.profile;

import lombok.*;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileDto {
    private Long id;
    private String email;
    private String name;
    private String phone;
    private String address;
    private String dateOfBirth;
    private String role;
    private Instant createdAt;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class UpdateProfileRequest {
    private String name;
    private String phone;
    private String address;
    private String dateOfBirth;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class ChangePasswordRequest {
    private String currentPassword;
    private String newPassword;
}
