package com.drona.lms.course.service;

import com.drona.lms.common.exception.ResourceNotFoundException;
import com.drona.lms.common.security.CourseAccessService;
import com.drona.lms.course.dto.CourseCreateRequest;
import com.drona.lms.course.dto.CourseResponse;
import com.drona.lms.course.dto.CourseUpdateRequest;
import com.drona.lms.domain.entity.Course;
import com.drona.lms.domain.repository.CourseRepository;
import com.drona.lms.domain.repository.UserRepository;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CourseAccessService courseAccessService;

    @Transactional(readOnly = true)
    public Page<CourseResponse> getCourses(String q, Boolean published, Pageable pageable) {
        return courseRepository.search(q, published, null, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getInstructorCourses(String instructorEmail, Pageable pageable) {
        var instructor = userRepository.findByEmail(instructorEmail)
                .orElseThrow(() -> new IllegalArgumentException("Instructor not found"));
        return courseRepository.search(null, null, instructor.getId(), pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CourseResponse getCourse(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));
        return toResponse(course);
    }

    @Transactional
    public CourseResponse createCourse(CourseCreateRequest request, String instructorEmail) {
        var instructor = userRepository.findByEmail(instructorEmail)
                .orElseThrow(() -> new IllegalArgumentException("Instructor not found"));

        Course course = new Course();
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setCategory(request.getCategory());
        course.setLevel(request.getLevel());
        course.setPublished(request.isPublished());
        course.setInstructor(instructor);

        return toResponse(courseRepository.save(course));
    }

    @Transactional
    public CourseResponse updateCourse(UUID courseId, CourseUpdateRequest request, String actorEmail) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        courseAccessService.assertAdminOrCourseInstructor(actorEmail, course.getInstructor().getEmail());

        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setCategory(request.getCategory());
        course.setLevel(request.getLevel());
        course.setPublished(request.isPublished());

        return toResponse(courseRepository.save(course));
    }

    @Transactional
    public void deleteCourse(UUID courseId, String actorEmail) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));
        courseAccessService.assertAdminOrCourseInstructor(actorEmail, course.getInstructor().getEmail());
        courseRepository.delete(course);
    }

    private CourseResponse toResponse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .category(course.getCategory())
                .level(course.getLevel())
                .published(course.isPublished())
                .price(course.getPrice() != null ? course.getPrice() : BigDecimal.ZERO)
                .instructorId(course.getInstructor() != null ? course.getInstructor().getId() : null)
                .instructorName(course.getInstructor() != null ? 
                    course.getInstructor().getFirstName() + " " + course.getInstructor().getLastName() : null)
                .build();
    }
}
