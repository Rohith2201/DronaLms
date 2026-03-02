package com.drona.lms.auth.controller;

import com.drona.lms.auth.dto.AdminAnalyticsResponse;
import com.drona.lms.auth.dto.UserResponse;
import com.drona.lms.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserResponse>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            Pageable pageable) {
        return ResponseEntity.ok(userService.getUsers(search, role, pageable));
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminAnalyticsResponse> getAnalytics() {
        return ResponseEntity.ok(userService.getAdminAnalytics());
    }

    @PatchMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable java.util.UUID userId,
            @RequestParam String role) {
        return ResponseEntity.ok(userService.updateUserRole(userId, role));
    }
}
