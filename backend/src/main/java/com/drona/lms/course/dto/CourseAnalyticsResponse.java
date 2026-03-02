package com.drona.lms.course.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseAnalyticsResponse {
    private Long totalEnrollments;
    private BigDecimal averageProgress;
    private Long completedCount;
    private Long inProgressCount;
    private Long notStartedCount;
    private BigDecimal completionRate;
    private List<MonthlyEnrollment> enrollmentTrends;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyEnrollment {
        private String month;
        private Long count;
    }
}
