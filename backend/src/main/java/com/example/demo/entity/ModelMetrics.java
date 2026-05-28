package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "model_metrics")
public class ModelMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    @Column(name = "model_id")
    private Integer modelId;

    @Column(name = "model_name", nullable = false, unique = true, length = 100)
    private String modelName;

    @Column(name = "accuracy", nullable = true)
    private Double accuracy;

    // =========================
    // FIXED COLUMN NAMES
    // =========================

    @Column(name = "precision_score", nullable = true)
    private Double precision;

    @Column(name = "recall_score", nullable = true)
    private Double recall;

    @Column(name = "f1_score", nullable = true)
    private Double f1Score;

    @Column(name = "auc_score", nullable = true)
    private Double auc;

    @Column(name = "expected_runtime_ms", nullable = true)
    private Integer expectedRuntimeMs;

    @Column(name = "trained_date")
    private LocalDateTime trainedDate;

    @Column(name = "version", length = 50)
    private String version;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // =====================================================
    // JPA Lifecycle
    // =====================================================

    @PrePersist
    protected void onCreate() {

        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();

        if (this.trainedDate == null) {
            this.trainedDate = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {

        this.updatedAt = LocalDateTime.now();
    }

    // =====================================================
    // Constructors
    // =====================================================

    public ModelMetrics() {
    }

    public ModelMetrics(
            String modelName,
            Double accuracy,
            Double precision,
            Double recall,
            Double f1Score,
            Double auc,
            Integer expectedRuntimeMs,
            String version
    ) {

        this.modelName = modelName;
        this.accuracy = accuracy;
        this.precision = precision;
        this.recall = recall;
        this.f1Score = f1Score;
        this.auc = auc;
        this.expectedRuntimeMs = expectedRuntimeMs;
        this.version = version;
    }

    // =====================================================
    // Getters & Setters
    // =====================================================

    public Integer getModelId() {
        return modelId;
    }

    public void setModelId(Integer modelId) {
        this.modelId = modelId;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public Double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(Double accuracy) {
        this.accuracy = accuracy;
    }

    public Double getPrecision() {
        return precision;
    }

    public void setPrecision(Double precision) {
        this.precision = precision;
    }

    public Double getRecall() {
        return recall;
    }

    public void setRecall(Double recall) {
        this.recall = recall;
    }

    public Double getF1Score() {
        return f1Score;
    }

    public void setF1Score(Double f1Score) {
        this.f1Score = f1Score;
    }

    public Double getAuc() {
        return auc;
    }

    public void setAuc(Double auc) {
        this.auc = auc;
    }

    public Integer getExpectedRuntimeMs() {
        return expectedRuntimeMs;
    }

    public void setExpectedRuntimeMs(Integer expectedRuntimeMs) {
        this.expectedRuntimeMs = expectedRuntimeMs;
    }

    public LocalDateTime getTrainedDate() {
        return trainedDate;
    }

    public void setTrainedDate(LocalDateTime trainedDate) {
        this.trainedDate = trainedDate;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // =====================================================
    // toString
    // =====================================================

    @Override
    public String toString() {

        return "ModelMetrics{" +
                "modelId=" + modelId +
                ", modelName='" + modelName + '\'' +
                ", accuracy=" + accuracy +
                ", precision=" + precision +
                ", recall=" + recall +
                ", f1Score=" + f1Score +
                ", auc=" + auc +
                ", expectedRuntimeMs=" + expectedRuntimeMs +
                ", version='" + version + '\'' +
                '}';
    }
}