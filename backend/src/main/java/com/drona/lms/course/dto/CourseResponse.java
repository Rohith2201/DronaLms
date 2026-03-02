package com.drona.lms.course.dto;

import com.drona.lms.module.dto.ModuleResponse;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CourseResponse {

    private UUID id;
    private String title;
    private String description;
    private String category;
    private String level;
    private boolean published;
    private BigDecimal price;
    private UUID instructorId;
    private String instructorName;
    
    // Admin metrics
    private Long enrollmentCount;
    private Double averageRating;
    private Integer ratingCount;
    private BigDecimal completionRate;
    private String status; // DRAFT, PUBLISHED, ARCHIVED
    
    // Course content
    private List<ModuleResponse> modules;
}
