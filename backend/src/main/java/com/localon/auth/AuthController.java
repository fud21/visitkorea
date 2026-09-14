package com.localon.auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService service;

    @PostMapping("/signup")
    public AuthService.AuthResponse signup(@Valid @RequestBody AuthService.SignupRequest request) {
        return service.signup(request);
    }

    @PostMapping("/login")
    public AuthService.AuthResponse login(@Valid @RequestBody AuthService.LoginRequest request) {
        return service.login(request);
    }

    @GetMapping("/me")
    public AuthService.UserResponse me() {
        return AuthService.UserResponse.of(service.current());
    }

    @PutMapping("/me")
    public AuthService.UserResponse updateMe(@Valid @RequestBody AuthService.ProfileUpdateRequest request) {
        return service.updateProfile(request);
    }

    @PostMapping("/logout")
    public void logout(@RequestHeader(value = "Authorization", required = false) String header) {
        service.logout(header != null && header.startsWith("Bearer ") ? header.substring(7) : null);
    }
}
