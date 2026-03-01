package com.drona.lms.ai.controller;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
public class AiController {

    private final String aiBaseUrl;

    public AiController(@Value("${app.ai-service.base-url}") String aiBaseUrl) {
        this.aiBaseUrl = aiBaseUrl;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "configured",
                "quizGenerationEndpoint", aiBaseUrl + "/api/v1/ai/quiz/generate",
                "summaryEndpoint", aiBaseUrl + "/api/v1/ai/course/summarize",
                "chatEndpoint", aiBaseUrl + "/api/v1/ai/chat");
    }
}
