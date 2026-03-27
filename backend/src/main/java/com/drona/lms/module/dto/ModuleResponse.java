package com.drona.lms.module.dto;

import com.drona.lms.lesson.dto.LessonResponse;
import com.drona.lms.quiz.dto.QuizResponse;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ModuleResponse {

    private UUID id;
    private UUID courseId;
    private String title;
    private String description;
    private Integer position;
    private List<LessonResponse> lessons;
    private List<QuizResponse> quizzes;
    
    // Frontend compatibility fields
    public Integer getOrder() {
        return position;
    }
    
    public boolean isIsLocked() {
        return false; // Default to unlocked, can be enhanced later
    }
}
