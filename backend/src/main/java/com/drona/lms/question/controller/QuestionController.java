package com.drona.lms.question.controller;

import com.drona.lms.question.dto.QuestionRequest;
import com.drona.lms.question.dto.QuestionResponse;
import com.drona.lms.question.service.QuestionService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping("/quiz/{quizId}")
    public ResponseEntity<Page<QuestionResponse>> getByQuiz(@PathVariable UUID quizId, Pageable pageable) {
        return ResponseEntity.ok(questionService.getByQuiz(quizId, pageable));
    }

    @GetMapping("/{questionId}")
    public ResponseEntity<QuestionResponse> get(@PathVariable UUID questionId) {
        return ResponseEntity.ok(questionService.get(questionId));
    }

    @PostMapping("/quiz/{quizId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<QuestionResponse> create(@PathVariable UUID quizId,
                                                   @Valid @RequestBody QuestionRequest request,
                                                   @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.create(quizId, request, principal.getUsername()));
    }

    @PutMapping("/{questionId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<QuestionResponse> update(@PathVariable UUID questionId,
                                                   @Valid @RequestBody QuestionRequest request,
                                                   @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(questionService.update(questionId, request, principal.getUsername()));
    }

    @DeleteMapping("/{questionId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<Void> delete(@PathVariable UUID questionId,
                                       @AuthenticationPrincipal UserDetails principal) {
        questionService.delete(questionId, principal.getUsername());
        return ResponseEntity.noContent().build();
    }
}