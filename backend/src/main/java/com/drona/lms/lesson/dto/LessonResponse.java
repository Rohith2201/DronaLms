package com.drona.lms.lesson.dto;

import com.drona.lms.domain.enums.LessonContentType;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LessonResponse {

    private UUID id;
    private UUID moduleId;
    private String title;
    private LessonContentType contentType;
    private String videoUrl;
    private String pdfUrl;
    private String contentText;
    private Integer durationSeconds;
    private Integer position;
}
