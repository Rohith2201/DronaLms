package com.drona.lms.certificate.dto;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CertificateResponse {

    private UUID id;
    private UUID enrollmentId;
    private UUID studentId;
    private UUID courseId;
    private String certificateNumber;
    private Instant issuedAt;
    private String fileUrl;
}