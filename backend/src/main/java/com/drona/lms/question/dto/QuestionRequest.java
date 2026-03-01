package com.drona.lms.question.dto;

import com.drona.lms.domain.enums.QuestionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuestionRequest {

    @NotBlank
    private String questionText;

    @NotNull
    private QuestionType questionType;

    private String optionsJson;

    private String correctAnswer;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal points;

    @NotNull
    private Integer position;
}