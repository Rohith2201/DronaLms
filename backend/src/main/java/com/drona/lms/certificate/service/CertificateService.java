package com.drona.lms.certificate.service;

import com.drona.lms.certificate.dto.CertificateIssueRequest;
import com.drona.lms.certificate.dto.CertificateResponse;
import com.drona.lms.common.exception.ResourceNotFoundException;
import com.drona.lms.common.security.CourseAccessService;
import com.drona.lms.domain.entity.Certificate;
import com.drona.lms.domain.repository.CertificateRepository;
import com.drona.lms.domain.repository.EnrollmentRepository;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseAccessService courseAccessService;

    @Transactional
    public CertificateResponse issue(CertificateIssueRequest request, String actorEmail) {
        var enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found: " + request.getEnrollmentId()));

        courseAccessService.assertAdminOrCourseInstructor(actorEmail, enrollment.getCourse().getInstructor().getEmail());

        if (!enrollment.isCompleted()) {
            throw new IllegalArgumentException("Certificate can be issued only for completed enrollments");
        }

        certificateRepository.findByEnrollmentId(enrollment.getId())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Certificate already issued for this enrollment");
                });

        Certificate certificate = new Certificate();
        certificate.setEnrollment(enrollment);
        certificate.setCertificateNumber(generateCertificateNumber());
        certificate.setIssuedAt(Instant.now());
        certificate.setFileUrl(request.getFileUrl());

        return toResponse(certificateRepository.save(certificate));
    }

    @Transactional(readOnly = true)
    public CertificateResponse get(UUID certificateId) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found: " + certificateId));
        return toResponse(certificate);
    }

    @Transactional(readOnly = true)
    public CertificateResponse getByEnrollment(UUID enrollmentId) {
        Certificate certificate = certificateRepository.findByEnrollmentId(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found for enrollment: " + enrollmentId));
        return toResponse(certificate);
    }

    @Transactional(readOnly = true)
    public Page<CertificateResponse> myCertificates(String studentEmail, Pageable pageable) {
        return certificateRepository.findByEnrollmentStudentEmail(studentEmail, pageable).map(this::toResponse);
    }

    private String generateCertificateNumber() {
        return "CERT-" + Instant.now().toEpochMilli() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private CertificateResponse toResponse(Certificate certificate) {
        var enrollment = certificate.getEnrollment();
        return CertificateResponse.builder()
                .id(certificate.getId())
                .enrollmentId(enrollment.getId())
                .studentId(enrollment.getStudent().getId())
                .courseId(enrollment.getCourse().getId())
                .certificateNumber(certificate.getCertificateNumber())
                .issuedAt(certificate.getIssuedAt())
                .fileUrl(certificate.getFileUrl())
                .build();
    }
}