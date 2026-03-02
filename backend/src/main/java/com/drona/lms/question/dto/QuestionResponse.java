package com.drona.lms.question.dto;

import com.drona.lms.domain.enums.QuestionType;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class QuestionResponse {

    private UUID id;
    private UUID quizId;
    private String questionText;
    private QuestionType questionType;
    private String optionsJson;
    private String correctAnswer;
    private BigDecimal points;
    private Integer position;
}