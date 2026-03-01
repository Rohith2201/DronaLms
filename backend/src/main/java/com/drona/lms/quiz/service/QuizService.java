package com.drona.lms.quiz.service;

import com.drona.lms.common.exception.ResourceNotFoundException;
import com.drona.lms.common.security.CourseAccessService;
import com.drona.lms.domain.entity.Quiz;
import com.drona.lms.domain.repository.CourseModuleRepository;
import com.drona.lms.domain.repository.QuizRepository;
import com.drona.lms.quiz.dto.QuizRequest;
import com.drona.lms.quiz.dto.QuizResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final CourseModuleRepository moduleRepository;
    private final CourseAccessService courseAccessService;

    @Transactional(readOnly = true)
    public Page<QuizResponse> getByModule(UUID moduleId, Pageable pageable) {
        return quizRepository.findByModuleId(moduleId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public QuizResponse get(UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        return toResponse(quiz);
    }

    @Transactional
    public QuizResponse create(UUID moduleId, QuizRequest request, String actorEmail) {
        var module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + moduleId));

        courseAccessService.assertAdminOrCourseInstructor(actorEmail, module.getCourse().getInstructor().getEmail());

        Quiz quiz = new Quiz();
        quiz.setModule(module);
        applyRequest(quiz, request);

        return toResponse(quizRepository.save(quiz));
    }

    @Transactional
    public QuizResponse update(UUID quizId, QuizRequest request, String actorEmail) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));

        courseAccessService.assertAdminOrCourseInstructor(actorEmail, quiz.getModule().getCourse().getInstructor().getEmail());

        applyRequest(quiz, request);
        return toResponse(quizRepository.save(quiz));
    }

    @Transactional
    public void delete(UUID quizId, String actorEmail) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        courseAccessService.assertAdminOrCourseInstructor(actorEmail, quiz.getModule().getCourse().getInstructor().getEmail());
        quizRepository.delete(quiz);
    }

    private void applyRequest(Quiz quiz, QuizRequest request) {
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setMaxScore(request.getMaxScore());
        quiz.setTimeLimitMinutes(request.getTimeLimitMinutes());
        quiz.setPassingScore(request.getPassingScore());
        quiz.setGeneratedByAi(request.isGeneratedByAi());
    }

    private QuizResponse toResponse(Quiz quiz) {
        return QuizResponse.builder()
                .id(quiz.getId())
                .moduleId(quiz.getModule().getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .maxScore(quiz.getMaxScore())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .passingScore(quiz.getPassingScore())
                .generatedByAi(quiz.isGeneratedByAi())
                .build();
    }
}