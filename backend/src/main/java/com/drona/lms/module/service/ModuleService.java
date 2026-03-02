package com.drona.lms.module.service;

import com.drona.lms.common.exception.ResourceNotFoundException;
import com.drona.lms.common.security.CourseAccessService;
import com.drona.lms.domain.entity.CourseModule;
import com.drona.lms.domain.repository.CourseModuleRepository;
import com.drona.lms.domain.repository.CourseRepository;
import com.drona.lms.module.dto.ModuleRequest;
import com.drona.lms.module.dto.ModuleResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final CourseAccessService courseAccessService;

    @Transactional(readOnly = true)
    public Page<ModuleResponse> getByCourse(UUID courseId, Pageable pageable) {
        return moduleRepository.findByCourseId(courseId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ModuleResponse get(UUID moduleId) {
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + moduleId));
        return toResponse(module);
    }

    @Transactional
    public ModuleResponse create(UUID courseId, ModuleRequest request, String actorEmail) {
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        courseAccessService.assertAdminOrCourseInstructor(actorEmail, course.getInstructor().getEmail());

        CourseModule module = new CourseModule();
        module.setCourse(course);
        module.setTitle(request.getTitle());
        module.setDescription(request.getDescription());
        module.setPosition(request.getPosition());
        return toResponse(moduleRepository.save(module));
    }

    @Transactional
    public ModuleResponse update(UUID moduleId, ModuleRequest request, String actorEmail) {
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + moduleId));

        courseAccessService.assertAdminOrCourseInstructor(actorEmail, module.getCourse().getInstructor().getEmail());

        module.setTitle(request.getTitle());
        module.setDescription(request.getDescription());
        module.setPosition(request.getPosition());
        return toResponse(moduleRepository.save(module));
    }

    @Transactional
    public void delete(UUID moduleId, String actorEmail) {
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + moduleId));
        courseAccessService.assertAdminOrCourseInstructor(actorEmail, module.getCourse().getInstructor().getEmail());
        moduleRepository.delete(module);
    }

    private ModuleResponse toResponse(CourseModule module) {
        return ModuleResponse.builder()
                .id(module.getId())
                .courseId(module.getCourse().getId())
                .title(module.getTitle())
                .description(module.getDescription())
                .position(module.getPosition())
                .build();
    }
}
