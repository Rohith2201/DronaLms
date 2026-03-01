package com.drona.lms.domain.repository;

import com.drona.lms.domain.entity.Quiz;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizRepository extends JpaRepository<Quiz, UUID> {

	Page<Quiz> findByModuleId(UUID moduleId, Pageable pageable);
}
