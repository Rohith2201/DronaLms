package com.drona.lms.domain.repository;

import com.drona.lms.domain.entity.Lesson;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LessonRepository extends JpaRepository<Lesson, UUID> {

    Page<Lesson> findByModuleId(UUID moduleId, Pageable pageable);
}
