package com.drona.lms.module.dto;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ModuleResponse {

    private UUID id;
    private UUID courseId;
    private String title;
    private String description;
    private Integer position;
}
