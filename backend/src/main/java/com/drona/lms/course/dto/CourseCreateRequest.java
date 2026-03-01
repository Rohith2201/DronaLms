package com.drona.lms.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourseCreateRequest {

    @NotBlank
    @Size(max = 255)
    private String title;

    private String description;

    @Size(max = 100)
    private String category;

    @Size(max = 50)
    private String level;

    private boolean published;
}
