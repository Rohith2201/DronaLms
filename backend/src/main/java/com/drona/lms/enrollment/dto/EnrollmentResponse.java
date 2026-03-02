package com.drona.lms.enrollment.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EnrollmentResponse {

    private UUID id;
    private UUID studentId;
    private UUID courseId;
    private Instant enrolledAt;
    private BigDecimal progressPercent;
    private boolean completed;
    private Instant completionDate;
}
