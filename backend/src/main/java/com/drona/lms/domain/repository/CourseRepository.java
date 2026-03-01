package com.drona.lms.domain.repository;

import com.drona.lms.domain.entity.Course;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

public interface CourseRepository extends JpaRepository<Course, UUID> {

		@Query("""
						SELECT c FROM Course c
						WHERE (:q IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :q, '%'))
								OR LOWER(c.category) LIKE LOWER(CONCAT('%', :q, '%')))
							AND (:published IS NULL OR c.published = :published)
						""")
		Page<Course> search(@Param("q") String q, @Param("published") Boolean published, Pageable pageable);
}
