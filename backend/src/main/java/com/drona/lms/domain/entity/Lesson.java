package com.drona.lms.domain.entity;

import com.drona.lms.common.model.BaseUuidEntity;
import com.drona.lms.domain.enums.LessonContentType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "lessons", uniqueConstraints = {
        @UniqueConstraint(name = "uk_lesson_position_per_module", columnNames = {"module_id", "position"})
})
public class Lesson extends BaseUuidEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private CourseModule module;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 30)
    private LessonContentType contentType;

    @Column(name = "video_url", columnDefinition = "TEXT")
    private String videoUrl;

    @Column(name = "pdf_url", columnDefinition = "TEXT")
    private String pdfUrl;

    @Column(name = "content_text", columnDefinition = "TEXT")
    private String contentText;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(nullable = false)
    private Integer position;

    @PrePersist
    protected void onCreateInternal() {
        super.assignIdIfMissing();
        super.onCreate();
    }

    @PreUpdate
    protected void onUpdateInternal() {
        super.onUpdate();
    }
}
