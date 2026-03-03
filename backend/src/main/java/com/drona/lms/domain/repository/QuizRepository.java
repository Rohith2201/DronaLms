package com.drona.lms.domain.repository;

import com.drona.lms.domain.entity.Quiz;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuizRepository extends JpaRepository<Quiz, UUID> {

	Page<Quiz> findByModuleId(UUID moduleId, Pageable pageable);
	
	@Query("SELECT COUNT(q) FROM Quiz q WHERE q.module.course.id = :courseId")
	Long countByCourseId(@Param("courseId") UUID courseId);
	
	@Query("SELECT COUNT(q) FROM Quiz q JOIN q.module m WHERE m.course.instructor.id = :instructorId")
	Long countByInstructorId(@Param("instructorId") UUID instructorId);
}
