package com.drona.lms.certificate.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CertificateIssueRequest {

    @NotNull
    private UUID enrollmentId;

    private String fileUrl;
}