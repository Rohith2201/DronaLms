package com.drona.lms.common.security;

import com.drona.lms.domain.enums.RoleCode;
import com.drona.lms.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CourseAccessService {

    private final UserRepository userRepository;

    public void assertAdminOrCourseInstructor(String actorEmail, String courseInstructorEmail) {
        if (isAdmin(actorEmail) || actorEmail.equalsIgnoreCase(courseInstructorEmail)) {
            return;
        }
        throw new IllegalArgumentException("Not allowed to manage resources outside your courses");
    }

    public boolean isAdmin(String actorEmail) {
        var user = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + actorEmail));
        return user.getRoles().stream().anyMatch(role -> role.getCode() == RoleCode.ADMIN);
    }
}