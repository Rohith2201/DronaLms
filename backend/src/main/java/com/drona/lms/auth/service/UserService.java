package com.drona.lms.auth.service;

import com.drona.lms.auth.dto.AdminAnalyticsResponse;
import com.drona.lms.auth.dto.UserResponse;
import com.drona.lms.domain.entity.User;
import com.drona.lms.domain.repository.UserRepository;
import com.drona.lms.domain.repository.RoleRepository;
import com.drona.lms.domain.repository.CourseRepository;
import com.drona.lms.domain.repository.EnrollmentRepository;
import com.drona.lms.domain.repository.CertificateRepository;
import com.drona.lms.domain.enums.RoleCode;
import com.drona.lms.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.Set;
import java.util.List;
import java.util.ArrayList;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.Instant;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CertificateRepository certificateRepository;

    @Transactional(readOnly = true)
    public Page<UserResponse> getUsers(String search, String role, Pageable pageable) {
        Page<User> users;
        
        boolean hasSearch = search != null && !search.isBlank();
        boolean hasRole = role != null && !role.isBlank();
        
        if (hasSearch && hasRole) {
            // Both filters
            RoleCode roleCode = RoleCode.valueOf(role);
            users = userRepository.searchByEmailOrNameAndRole(search, roleCode, pageable);
        } else if (hasSearch) {
            // Search only
            users = userRepository.searchByEmailOrName(search, pageable);
        } else if (hasRole) {
            // Role only
            RoleCode roleCode = RoleCode.valueOf(role);
            users = userRepository.findByRole(roleCode, pageable);
        } else {
            // No filters
            users = userRepository.findAll(pageable);
        }
        
        return users.map(this::toResponse);
    }

    @Transactional
    public UserResponse updateUserRole(UUID userId, String roleCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        var role = roleRepository.findByCode(com.drona.lms.domain.enums.RoleCode.valueOf(roleCode))
                .orElseThrow(() -> new IllegalArgumentException("Invalid role: " + roleCode));
        
        user.setRoles(Set.of(role));
        userRepository.save(user);
        
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsResponse getAdminAnalytics() {
        // Total counts
        long totalUsers = userRepository.count();
        long totalCourses = courseRepository.count();
        long totalEnrollments = enrollmentRepository.count();
        long totalCertificates = certificateRepository.count();

        // Role counts
        long studentCount = userRepository.findByRole(RoleCode.STUDENT, Pageable.unpaged()).getTotalElements();
        long instructorCount = userRepository.findByRole(RoleCode.INSTRUCTOR, Pageable.unpaged()).getTotalElements();
        long adminCount = userRepository.findByRole(RoleCode.ADMIN, Pageable.unpaged()).getTotalElements();

        // Active users (users created in last 30 days)
        Instant thirtyDaysAgo = Instant.now().minusSeconds(30L * 24 * 60 * 60);
        List<User> allUsers = userRepository.findAll();
        long activeUsers = allUsers.stream()
                .filter(u -> u.getCreatedAt().isAfter(thirtyDaysAgo))
                .count();

        // New users this month
        Instant startOfMonth = YearMonth.now().atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        long newUsersThisMonth = allUsers.stream()
                .filter(u -> u.getCreatedAt().isAfter(startOfMonth))
                .count();

        // User growth trend (last 6 months)
        List<AdminAnalyticsResponse.MonthlyTrend> userGrowthTrend = new ArrayList<>();
        YearMonth currentMonth = YearMonth.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        
        for (int i = 5; i >= 0; i--) {
            YearMonth month = currentMonth.minusMonths(i);
            Instant monthStart = month.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant monthEnd = month.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();
            
            long count = allUsers.stream()
                    .filter(u -> u.getCreatedAt().isAfter(monthStart) && u.getCreatedAt().isBefore(monthEnd))
                    .count();
            
            userGrowthTrend.add(AdminAnalyticsResponse.MonthlyTrend.builder()
                    .month(month.format(formatter))
                    .count(count)
                    .build());
        }

        return AdminAnalyticsResponse.builder()
                .totalUsers(totalUsers)
                .totalCourses(totalCourses)
                .totalEnrollments(totalEnrollments)
                .totalCertificates(totalCertificates)
                .activeUsers(activeUsers)
                .newUsersThisMonth(newUsersThisMonth)
                .studentCount(studentCount)
                .instructorCount(instructorCount)
                .adminCount(adminCount)
                .avgCompletionRate(0.0) // TODO: Calculate from enrollment progress
                .userGrowthTrend(userGrowthTrend)
                .build();
    }

    private UserResponse toResponse(User user) {
        String roleCode = user.getRoles().isEmpty() 
            ? "STUDENT" 
            : user.getRoles().iterator().next().getCode().name();
            
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(roleCode)
                .status(user.getStatus() != null ? user.getStatus().name() : "ACTIVE")
                .createdAt(LocalDateTime.ofInstant(user.getCreatedAt(), ZoneId.systemDefault()))
                .updatedAt(LocalDateTime.ofInstant(user.getUpdatedAt(), ZoneId.systemDefault()))
                .build();
    }
}
