package com.drona.lms.instructor.dto;

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
public class InstructorAnalyticsResponse {
    private Long totalCourses;
    private Long publishedCourses;
    private Long totalStudents;
    private Long newStudentsThisPeriod;
    private BigDecimal avgCompletionRate;
    private BigDecimal completionTrend;
    private BigDecimal avgRating;
    private Long totalRatings;
    private Long totalQuizzes;
    private Long quizAttempts;
    private BigDecimal avgStudentProgress;
    private Long engagementRate;
    private Long completedStudents;
    private Long activeStudents;
    private Long totalLessons;
    private Long totalAssignments;
    private Long totalResources;
    private List<TopCourse> topCourses;
    private List<StudentGrowth> studentGrowth;
    private List<EngagementByDay> engagementByDay;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopCourse {
        private java.util.UUID id;
        private String title;
        private String category;
        private String level;
        private Long enrollmentCount;
        private BigDecimal completionRate;
        private BigDecimal avgRating;
        private Long ratingCount;
        private Long quizCount;
        private BigDecimal avgQuizScore;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentGrowth {
        private String month;
        private Long total;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EngagementByDay {
        private String day;
        private Long engagement;
    }
}
