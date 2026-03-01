package com.drona.lms.domain.repository;

import com.drona.lms.domain.entity.Course;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;

public interface CourseRepository extends JpaRepository<Course, UUID> {

	@EntityGraph(attributePaths = {"instructor"})
		@Query("""
					SELECT c FROM Course c
					WHERE (:q IS NULL OR LOWER(CAST(c.title AS string)) LIKE LOWER(CONCAT('%', :q, '%'))
							OR LOWER(CAST(c.category AS string)) LIKE LOWER(CONCAT('%', :q, '%')))
							AND (:published IS NULL OR c.published = :published)
							AND (:instructorId IS NULL OR c.instructor.id = :instructorId)
						""")
		Page<Course> search(@Param("q") String q, @Param("published") Boolean published, 
		                    @Param("instructorId") UUID instructorId, Pageable pageable);
}
