package com.drona.lms.course.dto;

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
    private UUID instructorId;
    private String instructorName;
}
