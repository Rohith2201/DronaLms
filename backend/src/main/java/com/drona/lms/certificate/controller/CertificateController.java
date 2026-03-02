package com.drona.lms.certificate.controller;

import com.drona.lms.certificate.dto.CertificateIssueRequest;
import com.drona.lms.certificate.dto.CertificateResponse;
import com.drona.lms.certificate.service.CertificateService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR','STUDENT')")
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
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    public ResponseEntity<Page<CertificateResponse>> myCertificates(@AuthenticationPrincipal UserDetails principal,
                                                                    Pageable pageable) {
        return ResponseEntity.ok(certificateService.myCertificates(principal.getUsername(), pageable));
    }
    
    /**
     * Public endpoint to verify certificate by certificate number
     */
    @GetMapping("/public/verify/{certificateNumber}")
    public ResponseEntity<CertificateResponse> verifyCertificate(@PathVariable String certificateNumber) {
        return ResponseEntity.ok(certificateService.verifyCertificate(certificateNumber));
    }
    
    /**
     * Download certificate as PDF
     */
    @GetMapping("/{certificateId}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable UUID certificateId) {
        byte[] pdfBytes = certificateService.generatePdf(certificateId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "certificate.pdf");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}