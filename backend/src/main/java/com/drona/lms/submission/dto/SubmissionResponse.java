package com.drona.lms.submission.dto;

import com.drona.lms.domain.enums.SubmissionType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SubmissionResponse {

    private UUID id;
    private UUID studentId;
    private UUID quizId;
    private SubmissionType submissionType;
    private String title;
    private String answerJson;
    private BigDecimal score;
    private String feedback;
    private Instant submittedAt;
    private Instant gradedAt;
    private UUID gradedBy;
}
