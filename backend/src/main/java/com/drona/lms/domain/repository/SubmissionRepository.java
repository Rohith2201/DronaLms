package com.drona.lms.domain.repository;

import com.drona.lms.domain.entity.Submission;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    Page<Submission> findByStudentEmail(String email, Pageable pageable);

    Page<Submission> findByQuizId(UUID quizId, Pageable pageable);
}
