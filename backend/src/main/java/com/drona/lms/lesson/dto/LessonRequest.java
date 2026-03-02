package com.drona.lms.lesson.dto;

import com.drona.lms.domain.enums.LessonContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LessonRequest {

    @NotBlank
    @Size(max = 255)
    private String title;

    @NotNull
    private LessonContentType contentType;

    private String videoUrl;
    private String pdfUrl;
    private String contentText;
    private Integer durationSeconds;

    @NotNull
    private Integer position;
}
