package com.drona.lms.quiz.controller;

import com.drona.lms.quiz.dto.QuizRequest;
import com.drona.lms.quiz.dto.QuizResponse;
import com.drona.lms.quiz.service.QuizService;
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
@RequestMapping("/api/v1/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @GetMapping("/module/{moduleId}")
    public ResponseEntity<Page<QuizResponse>> getByModule(@PathVariable UUID moduleId, Pageable pageable) {
        return ResponseEntity.ok(quizService.getByModule(moduleId, pageable));
    }

    @GetMapping("/{quizId}")
    public ResponseEntity<QuizResponse> get(@PathVariable UUID quizId) {
        return ResponseEntity.ok(quizService.get(quizId));
    }

    @PostMapping("/module/{moduleId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<QuizResponse> create(@PathVariable UUID moduleId,
                                               @Valid @RequestBody QuizRequest request,
                                               @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.create(moduleId, request, principal.getUsername()));
    }

    @PutMapping("/{quizId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<QuizResponse> update(@PathVariable UUID quizId,
                                               @Valid @RequestBody QuizRequest request,
                                               @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(quizService.update(quizId, request, principal.getUsername()));
    }

    @DeleteMapping("/{quizId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<Void> delete(@PathVariable UUID quizId,
                                       @AuthenticationPrincipal UserDetails principal) {
        quizService.delete(quizId, principal.getUsername());
        return ResponseEntity.noContent().build();
    }
}