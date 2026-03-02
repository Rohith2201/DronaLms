package com.drona.lms.common.security;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.drona.lms.domain.entity.Role;
import com.drona.lms.domain.entity.User;
import com.drona.lms.domain.enums.RoleCode;
import com.drona.lms.domain.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CourseAccessServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CourseAccessService courseAccessService;

    @Test
    void shouldAllowAdminForAnyCourseInstructor() {
        User admin = userWithRole("admin@drona.com", RoleCode.ADMIN);
        when(userRepository.findByEmail("admin@drona.com")).thenReturn(Optional.of(admin));

        assertDoesNotThrow(() ->
                courseAccessService.assertAdminOrCourseInstructor("admin@drona.com", "owner@drona.com"));
    }

    @Test
    void shouldAllowOwnerInstructor() {
        User instructor = userWithRole("owner@drona.com", RoleCode.INSTRUCTOR);
        when(userRepository.findByEmail("owner@drona.com")).thenReturn(Optional.of(instructor));

        assertDoesNotThrow(() ->
                courseAccessService.assertAdminOrCourseInstructor("owner@drona.com", "owner@drona.com"));
    }

    @Test
    void shouldRejectNonOwnerInstructor() {
        User instructor = userWithRole("other@drona.com", RoleCode.INSTRUCTOR);
        when(userRepository.findByEmail("other@drona.com")).thenReturn(Optional.of(instructor));

        assertThrows(IllegalArgumentException.class, () ->
                courseAccessService.assertAdminOrCourseInstructor("other@drona.com", "owner@drona.com"));
    }

    private User userWithRole(String email, RoleCode roleCode) {
        User user = new User();
        user.setEmail(email);
        Role role = new Role();
        role.setCode(roleCode);
        user.getRoles().add(role);
        return user;
    }
}