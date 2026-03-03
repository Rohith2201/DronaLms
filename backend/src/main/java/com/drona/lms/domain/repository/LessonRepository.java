package com.drona.lms.domain.repository;

import com.drona.lms.domain.entity.Lesson;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LessonRepository extends JpaRepository<Lesson, UUID> {

    Page<Lesson> findByModuleId(UUID moduleId, Pageable pageable);

    @Query("SELECT COALESCE(MAX(l.position), 0) FROM Lesson l WHERE l.module.id = :moduleId")
    Integer findMaxPositionByModuleId(@Param("moduleId") UUID moduleId);
    
    @Query("SELECT COUNT(l) FROM Lesson l WHERE l.module.course.id = :courseId")
    Long countByCourseId(@Param("courseId") UUID courseId);
    
    @Query("SELECT COUNT(l) FROM Lesson l JOIN l.module m WHERE m.course.instructor.id = :instructorId")
    Long countByInstructorId(@Param("instructorId") UUID instructorId);
}
