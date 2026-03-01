package com.drona.lms.enrollment.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EnrollmentCreateRequest {

    @NotNull
    private UUID courseId;
}
