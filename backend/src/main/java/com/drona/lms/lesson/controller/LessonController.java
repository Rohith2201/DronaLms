package com.drona.lms.lesson.controller;

import com.drona.lms.lesson.dto.LessonRequest;
import com.drona.lms.lesson.dto.LessonResponse;
import com.drona.lms.lesson.service.LessonService;
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
@RequestMapping("/api/v1/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @GetMapping("/module/{moduleId}")
    public ResponseEntity<Page<LessonResponse>> getByModule(@PathVariable UUID moduleId, Pageable pageable) {
        return ResponseEntity.ok(lessonService.getByModule(moduleId, pageable));
    }

    @GetMapping("/{lessonId}")
    public ResponseEntity<LessonResponse> get(@PathVariable UUID lessonId) {
        return ResponseEntity.ok(lessonService.get(lessonId));
    }

    @PostMapping("/module/{moduleId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<LessonResponse> create(@PathVariable UUID moduleId,
                                                 @Valid @RequestBody LessonRequest request,
                                                 @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lessonService.create(moduleId, request, principal.getUsername()));
    }

    @PutMapping("/{lessonId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<LessonResponse> update(@PathVariable UUID lessonId,
                                                 @Valid @RequestBody LessonRequest request,
                                                 @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(lessonService.update(lessonId, request, principal.getUsername()));
    }

    @DeleteMapping("/{lessonId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<Void> delete(@PathVariable UUID lessonId,
                                       @AuthenticationPrincipal UserDetails principal) {
        lessonService.delete(lessonId, principal.getUsername());
        return ResponseEntity.noContent().build();
    }
}
