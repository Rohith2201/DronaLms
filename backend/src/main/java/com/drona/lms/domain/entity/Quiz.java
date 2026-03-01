package com.drona.lms.domain.entity;

import com.drona.lms.common.model.BaseUuidEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "quizzes")
public class Quiz extends BaseUuidEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private CourseModule module;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "max_score", nullable = false, precision = 8, scale = 2)
    private BigDecimal maxScore;

    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes;

    @Column(name = "passing_score", nullable = false, precision = 8, scale = 2)
    private BigDecimal passingScore;

    @Column(name = "generated_by_ai", nullable = false)
    private boolean generatedByAi = false;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Question> questions = new ArrayList<>();

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
