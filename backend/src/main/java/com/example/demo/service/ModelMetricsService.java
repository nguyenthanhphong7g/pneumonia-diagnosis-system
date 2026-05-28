package com.example.demo.service;

import com.example.demo.entity.ModelMetrics;
import com.example.demo.repository.ModelMetricsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ModelMetricsService {

    @Autowired
    private ModelMetricsRepository modelMetricsRepository;

    /**
     * Lấy tất cả metrics của các mô hình
     */
    public List<ModelMetrics> getAllModelMetrics() {
        return modelMetricsRepository.findAll();
    }

    /**
     * Lấy metrics của một mô hình cụ thể
     */
    public Optional<ModelMetrics> getModelMetrics(String modelName) {
        return modelMetricsRepository.findByModelName(modelName);
    }

    /**
     * Lưu hoặc cập nhật metrics của mô hình
     */
    public ModelMetrics saveOrUpdateMetrics(String modelName, Double accuracy, Double precision,
            Double recall, Double f1Score, Double auc,
            Integer expectedRuntimeMs, String version) {
        Optional<ModelMetrics> existing = modelMetricsRepository.findByModelName(modelName);

        ModelMetrics metrics;
        if (existing.isPresent()) {
            metrics = existing.get();
            metrics.setAccuracy(accuracy);
            metrics.setPrecision(precision);
            metrics.setRecall(recall);
            metrics.setF1Score(f1Score);
            metrics.setAuc(auc);
            metrics.setExpectedRuntimeMs(expectedRuntimeMs);
            metrics.setVersion(version);
            metrics.setUpdatedAt(LocalDateTime.now());
        } else {
            metrics = new ModelMetrics(modelName, accuracy, precision, recall, f1Score, auc,
                    expectedRuntimeMs, version);
        }

        return modelMetricsRepository.save(metrics);
    }

    /**
     * Xóa metrics của mô hình
     */
    public void deleteModelMetrics(String modelName) {
        Optional<ModelMetrics> metrics = modelMetricsRepository.findByModelName(modelName);
        metrics.ifPresent(modelMetricsRepository::delete);
    }

    /**
     * Kiểm tra mô hình có tồn tại không
     */
    public boolean isModelExists(String modelName) {
        return modelMetricsRepository.existsByModelName(modelName);
    }

    /**
     * Lấy thời gian chạy dự kiến của mô hình
     */
    public Integer getExpectedRuntimeMs(String modelName) {
        return modelMetricsRepository.findByModelName(modelName)
                .map(ModelMetrics::getExpectedRuntimeMs)
                .orElse(0);
    }

    /**
     * Lấy toàn bộ thông tin metrics của mô hình dưới dạng DTO
     */
    public ModelMetricsDTO getModelMetricsDTO(String modelName) {
        return modelMetricsRepository.findByModelName(modelName)
                .map(this::convertToDTO)
                .orElse(null);
    }

    /**
     * Convert entity sang DTO
     */
    private ModelMetricsDTO convertToDTO(ModelMetrics metrics) {
        return new ModelMetricsDTO(
                metrics.getModelName(),
                metrics.getAccuracy(),
                metrics.getPrecision(),
                metrics.getRecall(),
                metrics.getF1Score(),
                metrics.getAuc(),
                metrics.getExpectedRuntimeMs(),
                metrics.getVersion(),
                metrics.getTrainedDate());
    }

    /**
     * DTO để trả về cho client
     */
    public static class ModelMetricsDTO {
        private String modelName;
        private Double accuracy;
        private Double precision;
        private Double recall;
        private Double f1Score;
        private Double auc;
        private Integer expectedRuntimeMs;
        private String version;
        private LocalDateTime trainedDate;

        public ModelMetricsDTO(String modelName, Double accuracy, Double precision, Double recall,
                Double f1Score, Double auc, Integer expectedRuntimeMs, String version,
                LocalDateTime trainedDate) {
            this.modelName = modelName;
            this.accuracy = accuracy;
            this.precision = precision;
            this.recall = recall;
            this.f1Score = f1Score;
            this.auc = auc;
            this.expectedRuntimeMs = expectedRuntimeMs;
            this.version = version;
            this.trainedDate = trainedDate;
        }

        // Getters
        public String getModelName() {
            return modelName;
        }

        public Double getAccuracy() {
            return accuracy;
        }

        public Double getPrecision() {
            return precision;
        }

        public Double getRecall() {
            return recall;
        }

        public Double getF1Score() {
            return f1Score;
        }

        public Double getAuc() {
            return auc;
        }

        public Integer getExpectedRuntimeMs() {
            return expectedRuntimeMs;
        }

        public String getVersion() {
            return version;
        }

        public LocalDateTime getTrainedDate() {
            return trainedDate;
        }
    }
}
