package com.drona.lms.submission.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubmissionGradeRequest {

    @NotNull
    @DecimalMin("0.00")
    private BigDecimal score;

    private String feedback;
}