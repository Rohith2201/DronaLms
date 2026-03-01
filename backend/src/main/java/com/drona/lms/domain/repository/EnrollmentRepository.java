package com.drona.lms.domain.repository;

import com.drona.lms.domain.entity.Enrollment;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {

	Page<Enrollment> findByStudentEmail(String email, Pageable pageable);

	Optional<Enrollment> findByCourseIdAndStudentEmail(UUID courseId, String email);
}
