package com.drona.lms.domain.repository;

import com.drona.lms.domain.entity.Question;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

    Page<Question> findByQuizId(UUID quizId, Pageable pageable);
}