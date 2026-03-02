package com.drona.lms.certificate.service;

import com.drona.lms.certificate.dto.CertificateIssueRequest;
import com.drona.lms.certificate.dto.CertificateResponse;
import com.drona.lms.common.exception.ResourceNotFoundException;
import com.drona.lms.common.security.CourseAccessService;
import com.drona.lms.domain.entity.Certificate;
import com.drona.lms.domain.repository.CertificateRepository;
import com.drona.lms.domain.repository.EnrollmentRepository;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseAccessService courseAccessService;
    
    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    @Transactional
    public CertificateResponse issue(CertificateIssueRequest request, String actorEmail) {
        var enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found: " + request.getEnrollmentId()));

        // Allow students to claim their own certificates OR admin/instructor to issue them
        boolean isOwnEnrollment = enrollment.getStudent().getEmail().equals(actorEmail);
        if (!isOwnEnrollment) {
            courseAccessService.assertAdminOrCourseInstructor(actorEmail, enrollment.getCourse().getInstructor().getEmail());
        }

        if (!enrollment.isCompleted()) {
            throw new IllegalArgumentException("Certificate can be issued only for completed enrollments");
        }

        certificateRepository.findByEnrollmentId(enrollment.getId())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Certificate already issued for this enrollment");
                });

        Certificate certificate = new Certificate();
        certificate.setEnrollment(enrollment);
        certificate.setCertificateNumber(generateCertificateNumber());
        certificate.setIssuedAt(Instant.now());
        certificate.setFileUrl(request.getFileUrl());

        return toResponse(certificateRepository.save(certificate));
    }

    @Transactional(readOnly = true)
    public CertificateResponse get(UUID certificateId) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found: " + certificateId));
        return toResponse(certificate);
    }

    @Transactional(readOnly = true)
    public CertificateResponse getByEnrollment(UUID enrollmentId) {
        Certificate certificate = certificateRepository.findByEnrollmentId(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found for enrollment: " + enrollmentId));
        return toResponse(certificate);
    }

    @Transactional(readOnly = true)
    public Page<CertificateResponse> myCertificates(String studentEmail, Pageable pageable) {
        return certificateRepository.findByEnrollmentStudentEmail(studentEmail, pageable)
                .map(this::toResponse);
    }
    
    @Transactional(readOnly = true)
    public CertificateResponse verifyCertificate(String certificateNumber) {
        Certificate certificate = certificateRepository.findByCertificateNumber(certificateNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found: " + certificateNumber));
        return toResponse(certificate);
    }
    
    @Transactional(readOnly = true)
    public byte[] generatePdf(UUID certificateId) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found: " + certificateId));
        
        var enrollment = certificate.getEnrollment();
        var student = enrollment.getStudent();
        var course = enrollment.getCourse();
        String studentName = student.getFirstName() + " " + student.getLastName();
        
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();
            
            // Add styled border
            Rectangle border = new Rectangle(30, 30, 
                    document.getPageSize().getWidth() - 30, 
                    document.getPageSize().getHeight() - 30);
            border.setBorder(Rectangle.BOX);
            border.setBorderWidth(2);
            border.setBorderColor(new Color(30, 58, 138)); // Blue
            document.add(border);
            
            // Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 36, new Color(30, 58, 138));
            Paragraph title = new Paragraph("Certificate of Completion", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingBefore(60);
            title.setSpacingAfter(30);
            document.add(title);
            
            // Subtitle
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 14, new Color(107, 114, 128));
            Paragraph subtitle = new Paragraph("This is to certify that", subtitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);
            
            // Student Name
            Font nameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 28, new Color(251, 191, 36)); // Gold
            Paragraph name = new Paragraph(studentName, nameFont);
            name.setAlignment(Element.ALIGN_CENTER);
            name.setSpacingAfter(20);
            document.add(name);
            
            // Completion text
            Font completionFont = FontFactory.getFont(FontFactory.HELVETICA, 14, new Color(107, 114, 128));
            Paragraph completionText = new Paragraph("has successfully completed", completionFont);
            completionText.setAlignment(Element.ALIGN_CENTER);
            completionText.setSpacingAfter(20);
            document.add(completionText);
            
            // Course Title
            Font courseFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Color.BLACK);
            Paragraph courseTitle = new Paragraph(course.getTitle(), courseFont);
            courseTitle.setAlignment(Element.ALIGN_CENTER);
            courseTitle.setSpacingAfter(40);
            document.add(courseTitle);
            
            // Details table
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(60);
            table.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.setSpacingBefore(20);
            
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA, 11, Color.GRAY);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.BLACK);
            
            // Date
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMMM dd, yyyy")
                    .withZone(ZoneId.systemDefault());
            String completionDate = enrollment.getCompletionDate() != null 
                    ? formatter.format(enrollment.getCompletionDate())
                    : formatter.format(certificate.getIssuedAt());
            
            addTableCell(table, "Completion Date:", labelFont, Element.ALIGN_RIGHT);
            addTableCell(table, completionDate, valueFont, Element.ALIGN_LEFT);
            
            // Certificate Number
            addTableCell(table, "Certificate ID:", labelFont, Element.ALIGN_RIGHT);
            addTableCell(table, certificate.getCertificateNumber(), valueFont, Element.ALIGN_LEFT);
            
            document.add(table);
            
            // Verification info
            Font verifyFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.GRAY);
            Paragraph verifyText = new Paragraph("\n\nVerify this certificate at: " 
                    + frontendUrl + "/verify-certificate?cert=" + certificate.getCertificateNumber(), verifyFont);
            verifyText.setAlignment(Element.ALIGN_CENTER);
            document.add(verifyText);
            
            document.close();
            return out.toByteArray();
            
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF", e);
        }
    }
    
    private void addTableCell(PdfPTable table, String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(alignment);
        cell.setPadding(5);
        table.addCell(cell);
    }

    private String generateCertificateNumber() {
        return "CERT-" + Instant.now().toEpochMilli() + "-" 
                + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private CertificateResponse toResponse(Certificate certificate) {
        var enrollment = certificate.getEnrollment();
        var student = enrollment.getStudent();
        var course = enrollment.getCourse();
        
        String studentName = student.getFirstName() + " " + student.getLastName();
        String verificationUrl = frontendUrl + "/verify-certificate?cert=" + certificate.getCertificateNumber();
        String pdfUrl = "/api/v1/certificates/" + certificate.getId() + "/pdf";
        
        return CertificateResponse.builder()
                .id(certificate.getId())
                .enrollmentId(enrollment.getId())
                .studentId(student.getId())
                .courseId(course.getId())
                .certificateNumber(certificate.getCertificateNumber())
                .issuedAt(certificate.getIssuedAt())
                .fileUrl(certificate.getFileUrl())
                .studentName(studentName)
                .courseTitle(course.getTitle())
                .completionDate(enrollment.getCompletionDate())
                .verificationUrl(verificationUrl)
                .pdfUrl(pdfUrl)
                .build();
    }
}