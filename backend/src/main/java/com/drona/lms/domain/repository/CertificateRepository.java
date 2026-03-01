package com.drona.lms.domain.repository;

import com.drona.lms.domain.entity.Certificate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CertificateRepository extends JpaRepository<Certificate, UUID> {

    Optional<Certificate> findByEnrollmentId(UUID enrollmentId);

    Page<Certificate> findByEnrollmentStudentEmail(String studentEmail, Pageable pageable);
}