package com.drona.lms.course.controller;

import com.drona.lms.course.dto.CourseCreateRequest;
import com.drona.lms.course.dto.CourseResponse;
import com.drona.lms.course.dto.CourseUpdateRequest;
import com.drona.lms.course.service.CourseService;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<Page<CourseResponse>> getCourses(@RequestParam(required = false) String q,
                                                           @RequestParam(required = false) Boolean published,
                                                           Pageable pageable) {
        return ResponseEntity.ok(courseService.getCourses(q, published, pageable));
    }

    @GetMapping("/{courseId}")
    public ResponseEntity<CourseResponse> getCourse(@PathVariable UUID courseId) {
        return ResponseEntity.ok(courseService.getCourse(courseId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<CourseResponse> createCourse(@Valid @RequestBody CourseCreateRequest request,
                                                       @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(courseService.createCourse(request, principal.getUsername()));
    }

    @PutMapping("/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<CourseResponse> updateCourse(@PathVariable UUID courseId,
                                                       @Valid @RequestBody CourseUpdateRequest request,
                                                       @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(courseService.updateCourse(courseId, request, principal.getUsername()));
    }

    @DeleteMapping("/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<Void> deleteCourse(@PathVariable UUID courseId,
                                             @AuthenticationPrincipal UserDetails principal) {
        courseService.deleteCourse(courseId, principal.getUsername());
        return ResponseEntity.noContent().build();
    }
}
