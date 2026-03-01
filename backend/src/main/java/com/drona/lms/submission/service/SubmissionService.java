package com.drona.lms.submission.service;

import com.drona.lms.common.exception.ResourceNotFoundException;
import com.drona.lms.common.security.CourseAccessService;
import com.drona.lms.domain.entity.Submission;
import com.drona.lms.domain.enums.SubmissionType;
import com.drona.lms.domain.repository.QuizRepository;
import com.drona.lms.domain.repository.SubmissionRepository;
import com.drona.lms.domain.repository.UserRepository;
import com.drona.lms.submission.dto.SubmissionCreateRequest;
import com.drona.lms.submission.dto.SubmissionGradeRequest;
import com.drona.lms.submission.dto.SubmissionResponse;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final CourseAccessService courseAccessService;

    @Transactional
    public SubmissionResponse submit(String studentEmail, SubmissionCreateRequest request) {
        var student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        Submission submission = new Submission();
        submission.setStudent(student);
        submission.setSubmissionType(request.getSubmissionType());
        submission.setTitle(request.getTitle());
        submission.setAnswerJson(request.getAnswerJson());

        if (request.getSubmissionType() == SubmissionType.QUIZ) {
            if (request.getQuizId() == null) {
                throw new IllegalArgumentException("quizId is required for QUIZ submission");
            }
            var quiz = quizRepository.findById(request.getQuizId())
                    .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + request.getQuizId()));
            submission.setQuiz(quiz);
        }

        return toResponse(submissionRepository.save(submission));
    }

    @Transactional(readOnly = true)
    public Page<SubmissionResponse> mySubmissions(String studentEmail, Pageable pageable) {
        return submissionRepository.findByStudentEmail(studentEmail, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<SubmissionResponse> byQuiz(UUID quizId, Pageable pageable, String actorEmail) {
        var quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        courseAccessService.assertAdminOrCourseInstructor(actorEmail, quiz.getModule().getCourse().getInstructor().getEmail());
        return submissionRepository.findByQuizId(quizId, pageable).map(this::toResponse);
    }

    @Transactional
    public SubmissionResponse grade(UUID submissionId, SubmissionGradeRequest request, String graderEmail) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found: " + submissionId));

        if (submission.getQuiz() != null) {
            courseAccessService.assertAdminOrCourseInstructor(
                    graderEmail,
                    submission.getQuiz().getModule().getCourse().getInstructor().getEmail());
        }

        var grader = userRepository.findByEmail(graderEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Grader not found"));

        submission.setScore(request.getScore());
        submission.setFeedback(request.getFeedback());
        submission.setGradedAt(Instant.now());
        submission.setGradedBy(grader);

        return toResponse(submissionRepository.save(submission));
    }

    private SubmissionResponse toResponse(Submission submission) {
        return SubmissionResponse.builder()
                .id(submission.getId())
                .studentId(submission.getStudent().getId())
                .quizId(submission.getQuiz() == null ? null : submission.getQuiz().getId())
                .submissionType(submission.getSubmissionType())
                .title(submission.getTitle())
                .answerJson(submission.getAnswerJson())
                .score(submission.getScore())
                .feedback(submission.getFeedback())
                .submittedAt(submission.getSubmittedAt())
                .gradedAt(submission.getGradedAt())
                .gradedBy(submission.getGradedBy() == null ? null : submission.getGradedBy().getId())
                .build();
    }
}
