package com.drona.lms.quiz.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class QuizResponse {

    private UUID id;
    private UUID moduleId;
    private String title;
    private String description;
    private BigDecimal maxScore;
    private Integer timeLimitMinutes;
    private BigDecimal passingScore;
    private boolean generatedByAi;
}