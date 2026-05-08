package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "expert_reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpertReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diagnosis_id", nullable = false)
    private DiagnosisHistory diagnosis;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;

    @Column(nullable = false, length = 50)
    private String finalLabel;           // "Pneumonia" hoặc "Normal"

    @Column(columnDefinition = "nvarchar(max)")
    private String doctorComment;

    @Column(nullable = false)
    private Boolean isUsedForTraining = false;

    @Column(nullable = false)
    private LocalDateTime reviewedAt = LocalDateTime.now();
}