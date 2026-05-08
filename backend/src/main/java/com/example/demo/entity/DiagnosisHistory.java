package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "diagnosis_history")
public class DiagnosisHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Thêm quan hệ với ExpertReview
    @OneToOne(mappedBy = "diagnosis", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ExpertReview expertReview;

    // 🔥 Quan hệ với User
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "image_path")
    private String imagePath;

    private String label;

    private Double confidence;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // ===== Getter Setter =====
    public Long getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getImagePath() { return imagePath; }
    public void setImagePath(String imagePath) { this.imagePath = imagePath; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}