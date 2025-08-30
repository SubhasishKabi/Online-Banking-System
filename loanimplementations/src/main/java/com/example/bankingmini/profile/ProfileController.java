package com.example.bankingmini.profile;

import com.example.bankingmini.auth.Customer;
import com.example.bankingmini.common.RoleBasedAccessControl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @Autowired
    private RoleBasedAccessControl accessControl;

    @GetMapping
    public ResponseEntity<ProfileDto> getProfile() {
        Customer user = accessControl.getCurrentUser();
        ProfileDto profile = profileService.getProfile(user.getId());
        return ResponseEntity.ok(profile);
    }

    @PutMapping
    public ResponseEntity<ProfileDto> updateProfile(@RequestBody UpdateProfileRequest request) {
        Customer user = accessControl.getCurrentUser();
        ProfileDto updatedProfile = profileService.updateProfile(user.getId(), request);
        return ResponseEntity.ok(updatedProfile);
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@RequestBody ChangePasswordRequest request) {
        Customer user = accessControl.getCurrentUser();
        profileService.changePassword(user.getId(), request);
        return ResponseEntity.ok("Password changed successfully");
    }
}
