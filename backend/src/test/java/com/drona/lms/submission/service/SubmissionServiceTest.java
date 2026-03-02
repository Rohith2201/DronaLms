package com.drona.lms.submission.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.drona.lms.common.security.CourseAccessService;
import com.drona.lms.domain.entity.Course;
import com.drona.lms.domain.entity.CourseModule;
import com.drona.lms.domain.entity.Quiz;
import com.drona.lms.domain.entity.Submission;
import com.drona.lms.domain.entity.User;
import com.drona.lms.domain.repository.QuizRepository;
import com.drona.lms.domain.repository.SubmissionRepository;
import com.drona.lms.domain.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class SubmissionServiceTest {

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private CourseAccessService courseAccessService;

    @InjectMocks
    private SubmissionService submissionService;

    @Test
    void shouldRejectByQuizWhenInstructorDoesNotOwnCourse() {
        UUID quizId = UUID.randomUUID();
        Quiz quiz = buildQuiz("owner@drona.com");
        when(quizRepository.findById(quizId)).thenReturn(Optional.of(quiz));
        doThrow(new IllegalArgumentException("Not allowed"))
                .when(courseAccessService)
                .assertAdminOrCourseInstructor("other@drona.com", "owner@drona.com");

        assertThrows(IllegalArgumentException.class,
                () -> submissionService.byQuiz(quizId, Pageable.unpaged(), "other@drona.com"));
    }

    @Test
    void shouldAllowByQuizForOwnerInstructor() {
        UUID quizId = UUID.randomUUID();
        Quiz quiz = buildQuiz("owner@drona.com");
        Submission submission = new Submission();
        submission.setId(UUID.randomUUID());
        submission.setQuiz(quiz);
        User student = new User();
        student.setId(UUID.randomUUID());
        submission.setStudent(student);

        when(quizRepository.findById(quizId)).thenReturn(Optional.of(quiz));
        when(submissionRepository.findByQuizId(quizId, PageRequest.of(0, 10)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(submission)));

        var result = submissionService.byQuiz(quizId, PageRequest.of(0, 10), "owner@drona.com");

        verify(courseAccessService).assertAdminOrCourseInstructor("owner@drona.com", "owner@drona.com");
        assertEquals(1, result.getTotalElements());
    }

    private Quiz buildQuiz(String instructorEmail) {
        User instructor = new User();
        instructor.setEmail(instructorEmail);

        Course course = new Course();
        course.setInstructor(instructor);

        CourseModule module = new CourseModule();
        module.setCourse(course);

        Quiz quiz = new Quiz();
        quiz.setModule(module);
        return quiz;
    }
}