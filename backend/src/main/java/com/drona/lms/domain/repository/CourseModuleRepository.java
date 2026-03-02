package com.drona.lms.domain.repository;

import com.drona.lms.domain.entity.CourseModule;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseModuleRepository extends JpaRepository<CourseModule, UUID> {

    Page<CourseModule> findByCourseId(UUID courseId, Pageable pageable);
}
