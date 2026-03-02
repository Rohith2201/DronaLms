package com.drona.lms.course.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrolledUserResponse {
    private UUID enrollmentId;
    private UUID userId;
    private String userName;
    private String userEmail;
    private Instant enrolledAt;
    private BigDecimal progressPercent;
    private boolean completed;
    private Instant completionDate;
    private String status; // ACTIVE, COMPLETED, DROPPED
}
