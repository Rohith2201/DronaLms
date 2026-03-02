package com.drona.lms.submission.controller;

import com.drona.lms.submission.dto.SubmissionCreateRequest;
import com.drona.lms.submission.dto.SubmissionGradeRequest;
import com.drona.lms.submission.dto.SubmissionResponse;
import com.drona.lms.submission.service.SubmissionService;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SubmissionResponse> submit(@AuthenticationPrincipal UserDetails principal,
                                                     @Valid @RequestBody SubmissionCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(submissionService.submit(principal.getUsername(), request));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Page<SubmissionResponse>> mySubmissions(@AuthenticationPrincipal UserDetails principal,
                                                                  Pageable pageable) {
        return ResponseEntity.ok(submissionService.mySubmissions(principal.getUsername(), pageable));
    }

    @GetMapping("/quiz/{quizId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<Page<SubmissionResponse>> byQuiz(@PathVariable UUID quizId,
                                                           Pageable pageable,
                                                           @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(submissionService.byQuiz(quizId, pageable, principal.getUsername()));
    }

    @PatchMapping("/{submissionId}/grade")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<SubmissionResponse> grade(@PathVariable UUID submissionId,
                                                    @Valid @RequestBody SubmissionGradeRequest request,
                                                    @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(submissionService.grade(submissionId, request, principal.getUsername()));
    }
}
