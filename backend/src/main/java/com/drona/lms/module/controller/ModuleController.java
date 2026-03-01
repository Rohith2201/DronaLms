package com.drona.lms.module.controller;

import com.drona.lms.module.dto.ModuleRequest;
import com.drona.lms.module.dto.ModuleResponse;
import com.drona.lms.module.service.ModuleService;
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
@RequestMapping("/api/v1/modules")
@RequiredArgsConstructor
public class ModuleController {

    private final ModuleService moduleService;

    @GetMapping("/course/{courseId}")
    public ResponseEntity<Page<ModuleResponse>> getByCourse(@PathVariable UUID courseId, Pageable pageable) {
        return ResponseEntity.ok(moduleService.getByCourse(courseId, pageable));
    }

    @GetMapping("/{moduleId}")
    public ResponseEntity<ModuleResponse> get(@PathVariable UUID moduleId) {
        return ResponseEntity.ok(moduleService.get(moduleId));
    }

    @PostMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<ModuleResponse> create(@PathVariable UUID courseId,
                                                 @Valid @RequestBody ModuleRequest request,
                                                 @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(moduleService.create(courseId, request, principal.getUsername()));
    }

    @PutMapping("/{moduleId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<ModuleResponse> update(@PathVariable UUID moduleId,
                                                 @Valid @RequestBody ModuleRequest request,
                                                 @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(moduleService.update(moduleId, request, principal.getUsername()));
    }

    @DeleteMapping("/{moduleId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<Void> delete(@PathVariable UUID moduleId,
                                       @AuthenticationPrincipal UserDetails principal) {
        moduleService.delete(moduleId, principal.getUsername());
        return ResponseEntity.noContent().build();
    }
}
