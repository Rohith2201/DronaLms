package com.drona.lms.course.service;

import com.drona.lms.common.exception.ResourceNotFoundException;
import com.drona.lms.common.security.CourseAccessService;
import com.drona.lms.course.dto.CourseCreateRequest;
import com.drona.lms.course.dto.CourseResponse;
import com.drona.lms.course.dto.CourseUpdateRequest;
import com.drona.lms.course.dto.CourseAnalyticsResponse;
import com.drona.lms.course.dto.EnrolledUserResponse;
import com.drona.lms.domain.entity.Course;
import com.drona.lms.domain.entity.CourseModule;
import com.drona.lms.domain.entity.Enrollment;
import com.drona.lms.domain.entity.Lesson;
import com.drona.lms.domain.repository.CourseRepository;
import com.drona.lms.domain.repository.EnrollmentRepository;
import com.drona.lms.domain.repository.UserRepository;
import com.drona.lms.lesson.dto.LessonResponse;
import com.drona.lms.module.dto.ModuleResponse;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
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
    private final EnrollmentRepository enrollmentRepository;
    private final CourseAccessService courseAccessService;

    @Transactional(readOnly = true)
    public Page<CourseResponse> getCourses(String q, Boolean published, String category, String level, Pageable pageable) {
        return courseRepository.search(q, published, null, category, level, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getInstructorCourses(String instructorEmail, Pageable pageable) {
        var instructor = userRepository.findByEmail(instructorEmail)
                .orElseThrow(() -> new IllegalArgumentException("Instructor not found"));
        return courseRepository.search(null, null, instructor.getId(), null, null, pageable).map(this::toResponse);
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
        
        // Check if course has enrollments
        Long enrollmentCount = enrollmentRepository.countByCourseId(courseId);
        if (enrollmentCount > 0) {
            throw new IllegalStateException(
                "Cannot delete course '" + course.getTitle() + "' because it has " + enrollmentCount + 
                " active enrollment(s). Please remove or transfer enrollments before deleting the course."
            );
        }
        
        courseRepository.delete(course);
    }
    
    @Transactional(readOnly = true)
    public CourseAnalyticsResponse getCourseAnalytics(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));
        
        Long totalEnrollments = enrollmentRepository.countByCourseId(courseId);
        Long completedCount = enrollmentRepository.countByCourseIdAndCompleted(courseId, true);
        Long inProgressCount = enrollmentRepository.countInProgressByCourseId(courseId);
        Long notStartedCount = enrollmentRepository.countNotStartedByCourseId(courseId);
        
        Double avgProgress = enrollmentRepository.getAverageProgressByCourseId(courseId);
        BigDecimal averageProgress = BigDecimal.valueOf(avgProgress != null ? avgProgress : 0)
                .setScale(2, RoundingMode.HALF_UP);
        
        BigDecimal completionRate = totalEnrollments > 0 
            ? BigDecimal.valueOf(completedCount * 100.0 / totalEnrollments).setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        
        return CourseAnalyticsResponse.builder()
                .totalEnrollments(totalEnrollments)
                .averageProgress(averageProgress)
                .completedCount(completedCount)
                .inProgressCount(inProgressCount)
                .notStartedCount(notStartedCount)
                .completionRate(completionRate)
                .build();
    }
    
    @Transactional(readOnly = true)
    public Page<EnrolledUserResponse> getEnrolledUsers(UUID courseId, Pageable pageable) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));
        
        return enrollmentRepository.findByCourseId(courseId, pageable)
                .map(this::toEnrolledUserResponse);
    }
    
    private EnrolledUserResponse toEnrolledUserResponse(Enrollment enrollment) {
        String status;
        if (enrollment.isCompleted()) {
            status = "COMPLETED";
        } else if (enrollment.getProgressPercent().compareTo(BigDecimal.ZERO) > 0) {
            status = "ACTIVE";
        } else {
            status = "NOT_STARTED";
        }
        
        return EnrolledUserResponse.builder()
                .enrollmentId(enrollment.getId())
                .userId(enrollment.getStudent().getId())
                .userName(enrollment.getStudent().getFirstName() + " " + enrollment.getStudent().getLastName())
                .userEmail(enrollment.getStudent().getEmail())
                .enrolledAt(enrollment.getEnrolledAt())
                .progressPercent(enrollment.getProgressPercent())
                .completed(enrollment.isCompleted())
                .completionDate(enrollment.getCompletionDate())
                .status(status)
                .build();
    }

    private CourseResponse toResponse(Course course) {
        // Calculate enrollment metrics
        Long totalEnrollments = enrollmentRepository.countByCourseId(course.getId());
        Long completedEnrollments = enrollmentRepository.countByCourseIdAndCompleted(course.getId(), true);
        
        // Calculate completion rate
        BigDecimal completionRate = BigDecimal.ZERO;
        if (totalEnrollments > 0) {
            completionRate = BigDecimal.valueOf(completedEnrollments * 100.0 / totalEnrollments)
                    .setScale(2, RoundingMode.HALF_UP);
        }
        
        // Determine status
        String status = course.isPublished() ? "PUBLISHED" : "DRAFT";
        
        // Map modules and lessons
        List<ModuleResponse> modules = course.getModules().stream()
                .sorted(Comparator.comparing(CourseModule::getPosition))
                .map(this::toModuleResponse)
                .collect(Collectors.toList());
        
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
                // Admin metrics
                .enrollmentCount(totalEnrollments)
                .averageRating(0.0) // TODO: Calculate from reviews when review system is implemented
                .ratingCount(0) // TODO: Get from reviews table
                .completionRate(completionRate)
                .status(status)
                // Course content
                .modules(modules)
                .build();
    }
    
    private ModuleResponse toModuleResponse(CourseModule module) {
        List<LessonResponse> lessons = module.getLessons().stream()
                .sorted(Comparator.comparing(Lesson::getPosition))
                .map(this::toLessonResponse)
                .collect(Collectors.toList());
        
        return ModuleResponse.builder()
                .id(module.getId())
                .courseId(module.getCourse().getId())
                .title(module.getTitle())
                .description(module.getDescription())
                .position(module.getPosition())
                .lessons(lessons)
                .build();
    }
    
    private LessonResponse toLessonResponse(Lesson lesson) {
        return LessonResponse.builder()
                .id(lesson.getId())
                .moduleId(lesson.getModule().getId())
                .title(lesson.getTitle())
                .contentType(lesson.getContentType())
                .videoUrl(lesson.getVideoUrl())
                .pdfUrl(lesson.getPdfUrl())
                .contentText(lesson.getContentText())
                .durationSeconds(lesson.getDurationSeconds())
                .position(lesson.getPosition())
                .build();
    }
}
