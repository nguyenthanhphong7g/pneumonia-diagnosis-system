package com.example.demo.controller;

import com.example.demo.entity.ModelMetrics;
import com.example.demo.service.ModelMetricsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/metrics")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:8000" })
public class ModelMetricsController {

    @Autowired
    private ModelMetricsService modelMetricsService;

    /**
     * Get all model metrics
     */
    @GetMapping
    public ResponseEntity<List<ModelMetrics>> getAllMetrics() {
        List<ModelMetrics> metrics = modelMetricsService.getAllModelMetrics();
        return ResponseEntity.ok(metrics);
    }

    /**
     * Get metrics for a specific model
     */
    @GetMapping("/{modelName}")
    public ResponseEntity<?> getMetrics(@PathVariable String modelName) {
        Optional<ModelMetrics> metrics = modelMetricsService.getModelMetrics(modelName);
        if (metrics.isPresent()) {
            return ResponseEntity.ok(metrics.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Save or update metrics for a model
     * POST payload: {
     * "modelName": "ViT+LogisticRegression",
     * "accuracy": 0.85,
     * "precision": 0.88,
     * "recall": 0.82,
     * "f1Score": 0.85,
     * "auc": 0.91,
     * "expectedRuntimeMs": 150,
     * "version": "1.0"
     * }
     */
    @PostMapping("/save")
    public ResponseEntity<?> saveMetrics(@RequestBody Map<String, Object> payload) {
        try {
            String modelName = (String) payload.get("modelName");
            Double accuracy = ((Number) payload.get("accuracy")).doubleValue();
            Double precision = ((Number) payload.get("precision")).doubleValue();
            Double recall = ((Number) payload.get("recall")).doubleValue();
            Double f1Score = ((Number) payload.get("f1Score")).doubleValue();
            Double auc = ((Number) payload.get("auc")).doubleValue();
            Integer expectedRuntimeMs = ((Number) payload.get("expectedRuntimeMs")).intValue();
            String version = (String) payload.getOrDefault("version", "1.0");

            ModelMetrics saved = modelMetricsService.saveOrUpdateMetrics(
                    modelName, accuracy, precision, recall, f1Score, auc, expectedRuntimeMs, version);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Metrics saved successfully",
                    "modelId", saved.getModelId()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    /**
     * Delete metrics for a model
     */
    @DeleteMapping("/{modelName}")
    public ResponseEntity<?> deleteMetrics(@PathVariable String modelName) {
        try {
            modelMetricsService.deleteModelMetrics(modelName);
            return ResponseEntity.ok(Map.of("success", true, "message", "Metrics deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Check if model exists
     */
    @GetMapping("/{modelName}/exists")
    public ResponseEntity<Boolean> modelExists(@PathVariable String modelName) {
        boolean exists = modelMetricsService.isModelExists(modelName);
        return ResponseEntity.ok(exists);
    }
}
