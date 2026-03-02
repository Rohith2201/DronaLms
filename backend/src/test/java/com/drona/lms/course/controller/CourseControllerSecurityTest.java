package com.drona.lms.course.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.drona.lms.common.exception.GlobalExceptionHandler;
import com.drona.lms.config.SecurityConfig;
import com.drona.lms.course.dto.CourseResponse;
import com.drona.lms.course.service.CourseService;
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

@WebMvcTest(controllers = CourseController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
class CourseControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CourseService courseService;

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
    @WithMockUser(username = "instructor@drona.com", roles = {"INSTRUCTOR"})
    void createCourseShouldAllowInstructor() throws Exception {
        when(courseService.createCourse(any(), eq("instructor@drona.com"))).thenReturn(
                CourseResponse.builder().build());

        String requestJson = objectMapper.writeValueAsString(new CoursePayload());

        mockMvc.perform(post("/api/v1/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "student@drona.com", roles = {"STUDENT"})
    void createCourseShouldForbidStudent() throws Exception {
        String requestJson = objectMapper.writeValueAsString(new CoursePayload());

        mockMvc.perform(post("/api/v1/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "instructor@drona.com", roles = {"INSTRUCTOR"})
    void updateCourseShouldAllowInstructor() throws Exception {
        when(courseService.updateCourse(any(), any(), anyString())).thenReturn(CourseResponse.builder().build());

        String requestJson = objectMapper.writeValueAsString(new CoursePayload());

        mockMvc.perform(put("/api/v1/courses/11111111-1111-1111-1111-111111111111")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk());
    }

    private static class CoursePayload {
        public String title = "Course 1";
        public String description = "desc";
        public String category = "cat";
        public String level = "beginner";
        public boolean published = true;
    }
}