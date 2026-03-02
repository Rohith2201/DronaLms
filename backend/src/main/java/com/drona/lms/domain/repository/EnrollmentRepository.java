package com.drona.lms.domain.repository;

import com.drona.lms.domain.entity.Enrollment;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {

	Page<Enrollment> findByStudentEmail(String email, Pageable pageable);

	Optional<Enrollment> findByCourseIdAndStudentEmail(UUID courseId, String email);
	
	// Analytics queries
	Page<Enrollment> findByCourseId(UUID courseId, Pageable pageable);
	
	Long countByCourseId(UUID courseId);
	
	Long countByCourseIdAndCompleted(UUID courseId, boolean completed);
	
	@Query("SELECT COALESCE(AVG(e.progressPercent), 0) FROM Enrollment e WHERE e.course.id = :courseId")
	Double getAverageProgressByCourseId(@Param("courseId") UUID courseId);
	
	@Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = :courseId AND e.progressPercent > 0 AND e.completed = false")
	Long countInProgressByCourseId(@Param("courseId") UUID courseId);
	
	@Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = :courseId AND e.progressPercent = 0")
	Long countNotStartedByCourseId(@Param("courseId") UUID courseId);
	
	@Query("SELECT FUNCTION('TO_CHAR', e.enrolledAt, 'YYYY-MM') as month, COUNT(e) as count " +
	       "FROM Enrollment e WHERE e.course.id = :courseId " +
	       "GROUP BY FUNCTION('TO_CHAR', e.enrolledAt, 'YYYY-MM') " +
	       "ORDER BY month DESC")
	Object[] getMonthlyEnrollmentTrends(@Param("courseId") UUID courseId);
}

