package com.drona.lms.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnalyticsResponse {
    private Long totalUsers;
    private Long totalCourses;
    private Long totalEnrollments;
    private Long totalCertificates;
    private Long activeUsers;
    private Long newUsersThisMonth;
    private Long studentCount;
    private Long instructorCount;
    private Long adminCount;
    private Double avgCompletionRate;
    private List<MonthlyTrend> userGrowthTrend;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyTrend {
        private String month;
        private Long count;
    }
}
