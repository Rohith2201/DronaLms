package com.drona.lms.certificate.controller;

import com.drona.lms.certificate.dto.CertificateIssueRequest;
import com.drona.lms.certificate.dto.CertificateResponse;
import com.drona.lms.certificate.service.CertificateService;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @PostMapping("/issue")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<CertificateResponse> issue(@Valid @RequestBody CertificateIssueRequest request,
                                                     @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(certificateService.issue(request, principal.getUsername()));
    }

    @GetMapping("/{certificateId}")
    public ResponseEntity<CertificateResponse> get(@PathVariable UUID certificateId) {
        return ResponseEntity.ok(certificateService.get(certificateId));
    }

    @GetMapping("/enrollment/{enrollmentId}")
    public ResponseEntity<CertificateResponse> getByEnrollment(@PathVariable UUID enrollmentId) {
        return ResponseEntity.ok(certificateService.getByEnrollment(enrollmentId));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Page<CertificateResponse>> myCertificates(@AuthenticationPrincipal UserDetails principal,
                                                                    Pageable pageable) {
        return ResponseEntity.ok(certificateService.myCertificates(principal.getUsername(), pageable));
    }
}