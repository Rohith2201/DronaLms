package com.drona.lms.enrollment.controller;

import com.drona.lms.enrollment.dto.EnrollmentCreateRequest;
import com.drona.lms.enrollment.dto.EnrollmentProgressRequest;
import com.drona.lms.enrollment.dto.EnrollmentResponse;
import com.drona.lms.enrollment.service.EnrollmentService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('STUDENT','ADMIN','INSTRUCTOR')")
    public ResponseEntity<Page<EnrollmentResponse>> myEnrollments(@AuthenticationPrincipal UserDetails principal,
                                                                  Pageable pageable) {
        return ResponseEntity.ok(enrollmentService.myEnrollments(principal.getUsername(), pageable));
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<EnrollmentResponse> enroll(@AuthenticationPrincipal UserDetails principal,
                                                     @Valid @RequestBody EnrollmentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(enrollmentService.enroll(principal.getUsername(), request));
    }

    @PatchMapping("/{enrollmentId}/progress")
    @PreAuthorize("hasAnyRole('STUDENT','ADMIN','INSTRUCTOR')")
    public ResponseEntity<EnrollmentResponse> updateProgress(@PathVariable UUID enrollmentId,
                                                             @Valid @RequestBody EnrollmentProgressRequest request,
                                                             @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(enrollmentService.updateProgress(enrollmentId, request, principal));
    }
}
