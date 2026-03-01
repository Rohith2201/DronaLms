package com.drona.lms.domain.repository;

import com.drona.lms.domain.entity.Course;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

public interface CourseRepository extends JpaRepository<Course, UUID> {

    @Query(
        value = """
            SELECT c.* FROM courses c
            WHERE (:q IS NULL OR :q = '' OR
                   LOWER(c.title) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(c.category) LIKE LOWER(CONCAT('%', :q, '%')))
            AND (:published IS NULL OR c.published = :published)
            AND (:instructorId IS NULL OR c.instructor_id = :instructorId)
        """,
        countQuery = """
            SELECT COUNT(*) FROM courses c
            WHERE (:q IS NULL OR :q = '' OR
                   LOWER(c.title) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(c.category) LIKE LOWER(CONCAT('%', :q, '%')))
            AND (:published IS NULL OR c.published = :published)
            AND (:instructorId IS NULL OR c.instructor_id = :instructorId)
        """,
        nativeQuery = true
    )
    Page<Course> search(
            @Param("q") String q,
            @Param("published") Boolean published,
            @Param("instructorId") UUID instructorId,
            Pageable pageable
    );
}