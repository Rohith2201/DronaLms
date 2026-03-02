package com.drona.lms.lesson.service;

import com.drona.lms.common.exception.ResourceNotFoundException;
import com.drona.lms.common.security.CourseAccessService;
import com.drona.lms.domain.entity.Lesson;
import com.drona.lms.domain.repository.CourseModuleRepository;
import com.drona.lms.domain.repository.LessonRepository;
import com.drona.lms.lesson.dto.LessonRequest;
import com.drona.lms.lesson.dto.LessonResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final CourseModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final CourseAccessService courseAccessService;

    @Transactional(readOnly = true)
    public Page<LessonResponse> getByModule(UUID moduleId, Pageable pageable) {
        return lessonRepository.findByModuleId(moduleId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public LessonResponse get(UUID lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found: " + lessonId));
        return toResponse(lesson);
    }

    @Transactional
    public LessonResponse create(UUID moduleId, LessonRequest request, String actorEmail) {
        var module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + moduleId));

        courseAccessService.assertAdminOrCourseInstructor(actorEmail, module.getCourse().getInstructor().getEmail());

        Lesson lesson = new Lesson();
        lesson.setModule(module);
        lesson.setTitle(request.getTitle());
        lesson.setContentType(request.getContentType());
        lesson.setVideoUrl(request.getVideoUrl());
        lesson.setPdfUrl(request.getPdfUrl());
        lesson.setContentText(request.getContentText());
        lesson.setDurationSeconds(request.getDurationSeconds());

        Integer maxPosition = lessonRepository.findMaxPositionByModuleId(moduleId);

        lesson.setPosition(maxPosition + 1);

        return toResponse(lessonRepository.save(lesson));
    }

    @Transactional
    public LessonResponse update(UUID lessonId, LessonRequest request, String actorEmail) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found: " + lessonId));

        courseAccessService.assertAdminOrCourseInstructor(actorEmail,
                lesson.getModule().getCourse().getInstructor().getEmail());

        lesson.setTitle(request.getTitle());
        lesson.setContentType(request.getContentType());
        lesson.setVideoUrl(request.getVideoUrl());
        lesson.setPdfUrl(request.getPdfUrl());
        lesson.setContentText(request.getContentText());
        lesson.setDurationSeconds(request.getDurationSeconds());
        lesson.setPosition(request.getPosition());
        return toResponse(lessonRepository.save(lesson));
    }

    @Transactional
    public void delete(UUID lessonId, String actorEmail) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found: " + lessonId));
        courseAccessService.assertAdminOrCourseInstructor(actorEmail,
                lesson.getModule().getCourse().getInstructor().getEmail());
        lessonRepository.delete(lesson);
    }

    private LessonResponse toResponse(Lesson lesson) {
        return LessonResponse.builder()
                .id(lesson.getId())
                .moduleId(lesson.getModule().getId())
                .title(lesson.getTitle())
                .contentType(lesson.getContentType())
                .videoUrl(lesson.getVideoUrl())
                .pdfUrl(lesson.getPdfUrl())
                .contentText(lesson.getContentText())
                .durationSeconds(lesson.getDurationSeconds())
                .position(lesson.getPosition())
                .build();
    }
}
