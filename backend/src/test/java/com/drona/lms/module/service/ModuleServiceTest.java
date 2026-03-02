package com.drona.lms.module.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.drona.lms.common.security.CourseAccessService;
import com.drona.lms.domain.entity.Course;
import com.drona.lms.domain.entity.CourseModule;
import com.drona.lms.domain.entity.User;
import com.drona.lms.domain.repository.CourseModuleRepository;
import com.drona.lms.domain.repository.CourseRepository;
import com.drona.lms.module.dto.ModuleRequest;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ModuleServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseModuleRepository moduleRepository;

    @Mock
    private CourseAccessService courseAccessService;

    @InjectMocks
    private ModuleService moduleService;

    @Test
    void shouldRejectCreateWhenActorDoesNotOwnCourse() {
        UUID courseId = UUID.randomUUID();
        Course course = buildCourse("owner@drona.com");

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        doThrow(new IllegalArgumentException("Not allowed"))
                .when(courseAccessService)
                .assertAdminOrCourseInstructor("other@drona.com", "owner@drona.com");

        ModuleRequest request = new ModuleRequest();
        request.setTitle("M1");
        request.setDescription("Desc");
        request.setPosition(1);

        assertThrows(IllegalArgumentException.class,
                () -> moduleService.create(courseId, request, "other@drona.com"));
    }

    @Test
    void shouldCreateWhenOwnershipCheckPasses() {
        UUID courseId = UUID.randomUUID();
        Course course = buildCourse("owner@drona.com");

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(moduleRepository.save(any(CourseModule.class))).thenAnswer(invocation -> {
            CourseModule module = invocation.getArgument(0);
            module.setId(UUID.randomUUID());
            return module;
        });

        ModuleRequest request = new ModuleRequest();
        request.setTitle("M1");
        request.setDescription("Desc");
        request.setPosition(1);

        var response = moduleService.create(courseId, request, "owner@drona.com");

        verify(courseAccessService).assertAdminOrCourseInstructor("owner@drona.com", "owner@drona.com");
        assertEquals("M1", response.getTitle());
        assertEquals(1, response.getPosition());
    }

    private Course buildCourse(String instructorEmail) {
        User instructor = new User();
        instructor.setEmail(instructorEmail);

        Course course = new Course();
        course.setId(UUID.randomUUID());
        course.setInstructor(instructor);
        return course;
    }
}