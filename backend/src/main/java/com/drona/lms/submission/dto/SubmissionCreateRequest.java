package com.drona.lms.submission.dto;

import com.drona.lms.domain.enums.SubmissionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubmissionCreateRequest {

    @NotNull
    private SubmissionType submissionType;

    private UUID quizId;

    @Size(max = 255)
    private String title;

    private String answerJson;
}
