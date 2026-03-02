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
@Table(name = "courses")
public class Course extends BaseUuidEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String category;

    @Column(length = 50)
    private String level;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Column(nullable = false)
    private boolean published = false;

    @Column(nullable = false, precision = 10, scale = 2)
private BigDecimal price = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private User instructor;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CourseModule> modules = new ArrayList<>();

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
