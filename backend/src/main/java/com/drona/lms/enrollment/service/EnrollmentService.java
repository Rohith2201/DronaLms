package com.drona.lms.enrollment.service;

import com.drona.lms.common.exception.ResourceNotFoundException;
import com.drona.lms.common.security.CourseAccessService;
import com.drona.lms.domain.entity.Enrollment;
import com.drona.lms.domain.repository.CourseRepository;
import com.drona.lms.domain.repository.EnrollmentRepository;
import com.drona.lms.domain.repository.UserRepository;
import com.drona.lms.enrollment.dto.EnrollmentCreateRequest;
import com.drona.lms.enrollment.dto.EnrollmentProgressRequest;
import com.drona.lms.enrollment.dto.EnrollmentResponse;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CourseAccessService courseAccessService;

    @Transactional(readOnly = true)
    public Page<EnrollmentResponse> myEnrollments(String studentEmail, Pageable pageable) {
        return enrollmentRepository.findByStudentEmail(studentEmail, pageable).map(this::toResponse);
    }

    @Transactional
    public EnrollmentResponse enroll(String studentEmail, EnrollmentCreateRequest request) {
        var student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        var course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + request.getCourseId()));

        enrollmentRepository.findByCourseIdAndStudentEmail(course.getId(), studentEmail)
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Already enrolled in this course");
                });

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setProgressPercent(BigDecimal.ZERO);
        enrollment.setCompleted(false);

        return toResponse(enrollmentRepository.save(enrollment));
    }

    @Transactional
    public EnrollmentResponse updateProgress(java.util.UUID enrollmentId,
                                             EnrollmentProgressRequest request,
                                             UserDetails principal) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found: " + enrollmentId));

        boolean isAdminOrInstructor = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_INSTRUCTOR"));

        boolean isAdmin = principal.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        boolean isInstructor = principal.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_INSTRUCTOR"));

        if (isInstructor && !isAdmin) {
            courseAccessService.assertAdminOrCourseInstructor(
                principal.getUsername(),
                enrollment.getCourse().getInstructor().getEmail());
        }

        if (!isAdminOrInstructor && !enrollment.getStudent().getEmail().equals(principal.getUsername())) {
            throw new IllegalArgumentException("Not allowed to update this enrollment");
        }

        BigDecimal progress = request.getProgressPercent();
        enrollment.setProgressPercent(progress);
        if (progress.compareTo(new BigDecimal("100.00")) >= 0) {
            enrollment.setCompleted(true);
            if (enrollment.getCompletionDate() == null) {
                enrollment.setCompletionDate(Instant.now());
            }
        } else {
            enrollment.setCompleted(false);
            enrollment.setCompletionDate(null);
        }

        return toResponse(enrollmentRepository.save(enrollment));
    }

    private EnrollmentResponse toResponse(Enrollment enrollment) {
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .studentId(enrollment.getStudent().getId())
                .courseId(enrollment.getCourse().getId())
                .enrolledAt(enrollment.getEnrolledAt())
                .progressPercent(enrollment.getProgressPercent())
                .completed(enrollment.isCompleted())
                .completionDate(enrollment.getCompletionDate())
                .build();
    }
}
