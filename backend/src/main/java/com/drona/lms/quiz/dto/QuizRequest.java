package com.drona.lms.quiz.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuizRequest {

    @NotBlank
    @Size(max = 255)
    private String title;

    private String description;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal maxScore;

    private Integer timeLimitMinutes;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal passingScore;

    private boolean generatedByAi;
}