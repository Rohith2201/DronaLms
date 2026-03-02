package com.drona.lms.domain.entity;

import com.drona.lms.common.model.BaseUuidEntity;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "certificates")
public class Certificate extends BaseUuidEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false, unique = true)
    private Enrollment enrollment;

    @Column(name = "certificate_number", nullable = false, unique = true, length = 100)
    private String certificateNumber;

    @Column(name = "issued_at", nullable = false)
    private Instant issuedAt = Instant.now();

    @Column(name = "file_url", columnDefinition = "TEXT")
    private String fileUrl;

    @PrePersist
    protected void onCreateInternal() {
        super.assignIdIfMissing();
        super.onCreate();
    }

    @PreUpdate
    protected void onUpdateInternal() {
        super.onUpdate();
    }
}
