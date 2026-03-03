package com.drona.lms.instructor.controller;

import com.drona.lms.common.exception.ResourceNotFoundException;
import com.drona.lms.domain.entity.User;
import com.drona.lms.domain.repository.UserRepository;
import com.drona.lms.instructor.dto.InstructorAnalyticsResponse;
import com.drona.lms.instructor.service.InstructorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/instructor")
@RequiredArgsConstructor
public class InstructorController {
    
    private final InstructorService instructorService;
    private final UserRepository userRepository;
    
    @GetMapping("/analytics")
    public ResponseEntity<InstructorAnalyticsResponse> getAnalytics(Authentication authentication) {
        String email = authentication.getName();
        User instructor = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(instructorService.getInstructorAnalytics(instructor));
    }
}
