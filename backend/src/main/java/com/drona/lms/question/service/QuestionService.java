package com.drona.lms.question.service;

import com.drona.lms.common.exception.ResourceNotFoundException;
import com.drona.lms.common.security.CourseAccessService;
import com.drona.lms.domain.entity.Question;
import com.drona.lms.domain.repository.QuestionRepository;
import com.drona.lms.domain.repository.QuizRepository;
import com.drona.lms.question.dto.QuestionRequest;
import com.drona.lms.question.dto.QuestionResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;
    private final CourseAccessService courseAccessService;

    @Transactional(readOnly = true)
    public Page<QuestionResponse> getByQuiz(UUID quizId, Pageable pageable) {
        return questionRepository.findByQuizId(quizId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public QuestionResponse get(UUID questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));
        return toResponse(question);
    }

    @Transactional
    public QuestionResponse create(UUID quizId, QuestionRequest request, String actorEmail) {
        var quiz = quizRepository.findByIdWithCourseAndInstructor(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));

        courseAccessService.assertAdminOrCourseInstructor(actorEmail, quiz.getModule().getCourse().getInstructor().getEmail());

        Question question = new Question();
        question.setQuiz(quiz);
        applyRequest(question, request);
        return toResponse(questionRepository.save(question));
    }

    @Transactional
    public QuestionResponse update(UUID questionId, QuestionRequest request, String actorEmail) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));
        
        // Fetch quiz with course and instructor for access check
        var quiz = quizRepository.findByIdWithCourseAndInstructor(question.getQuiz().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        
        courseAccessService.assertAdminOrCourseInstructor(actorEmail, quiz.getModule().getCourse().getInstructor().getEmail());
        applyRequest(question, request);
        return toResponse(questionRepository.save(question));
    }

    @Transactional
    public void delete(UUID questionId, String actorEmail) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));
        
        // Fetch quiz with course and instructor for access check
        var quiz = quizRepository.findByIdWithCourseAndInstructor(question.getQuiz().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        
        courseAccessService.assertAdminOrCourseInstructor(actorEmail, quiz.getModule().getCourse().getInstructor().getEmail());
        questionRepository.delete(question);
    }

    private void applyRequest(Question question, QuestionRequest request) {
        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType());
        question.setOptionsJson(request.getOptionsJson());
        question.setCorrectAnswer(request.getCorrectAnswer());
        question.setPoints(request.getPoints());
        question.setPosition(request.getPosition());
    }

    private QuestionResponse toResponse(Question question) {
        return QuestionResponse.builder()
                .id(question.getId())
                .quizId(question.getQuiz().getId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .optionsJson(question.getOptionsJson())
                .correctAnswer(question.getCorrectAnswer())
                .points(question.getPoints())
                .position(question.getPosition())
                .build();
    }
}