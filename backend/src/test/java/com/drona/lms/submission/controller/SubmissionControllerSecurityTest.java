package com.drona.lms.submission.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.drona.lms.common.exception.GlobalExceptionHandler;
import com.drona.lms.config.SecurityConfig;
import com.drona.lms.submission.dto.SubmissionResponse;
import com.drona.lms.submission.service.SubmissionService;
import com.drona.lms.security.JwtAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = SubmissionController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
class SubmissionControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SubmissionService submissionService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private UserDetailsService userDetailsService;

    @BeforeEach
    void setUp() throws Exception {
        doAnswer(invocation -> {
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

    @Test
    @WithMockUser(username = "student@drona.com", roles = {"STUDENT"})
    void gradeShouldForbidStudent() throws Exception {
        String requestJson = objectMapper.writeValueAsString(new GradePayload());

        mockMvc.perform(patch("/api/v1/submissions/11111111-1111-1111-1111-111111111111/grade")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "instructor@drona.com", roles = {"INSTRUCTOR"})
    void gradeShouldAllowInstructor() throws Exception {
        when(submissionService.grade(any(), any(), anyString())).thenReturn(SubmissionResponse.builder().build());
        String requestJson = objectMapper.writeValueAsString(new GradePayload());

        mockMvc.perform(patch("/api/v1/submissions/11111111-1111-1111-1111-111111111111/grade")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk());
    }

    private static class GradePayload {
        public double score = 85.0;
        public String feedback = "Good work";
    }
}