package com.drona.lms.domain.entity;

import com.drona.lms.common.model.BaseUuidEntity;
import jakarta.persistence.*;
import java.time.Instant;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "enrollments", uniqueConstraints = {
        @UniqueConstraint(name = "uk_student_course_enrollment", columnNames = {"student_id", "course_id"})
})
public class Enrollment extends BaseUuidEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "enrolled_at", nullable = false)
    private Instant enrolledAt = Instant.now();

    @Column(name = "progress_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal progressPercent = BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean completed = false;

    @Column(name = "completion_date")
    private Instant completionDate;

    @OneToOne(mappedBy = "enrollment", cascade = CascadeType.ALL, orphanRemoval = true)
    private Certificate certificate;

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
