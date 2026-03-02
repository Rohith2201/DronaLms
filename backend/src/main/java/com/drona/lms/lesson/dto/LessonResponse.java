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
    
    // Frontend compatibility fields
    public String getType() {
        return contentType != null ? contentType.name() : "TEXT";
    }
    
    public Integer getDuration() {
        return durationSeconds != null ? durationSeconds : 0;
    }
    
    public Integer getOrder() {
        return position;
    }
    
    public boolean isIsPreview() {
        return false; // Default to not preview
    }
    
    public boolean isIsCompleted() {
        return false; // Will be determined by enrollment progress
    }
    
    public String getContentUrl() {
        // Return the appropriate URL based on content type
        if (contentType == LessonContentType.VIDEO) {
            return videoUrl;
        } else if (contentType == LessonContentType.PDF) {
            return pdfUrl;
        }
        return null;
    }
}
