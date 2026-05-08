package com.example.demo.controller;

import com.example.demo.service.TrainingDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    @Autowired
    private TrainingDataService trainingDataService;

    /**
     * Dashboard - Lấy thống kê về model training
     */
    @GetMapping("/model-stats")
    public ResponseEntity<?> getModelStats() {
        try {
            Map<String, Object> stats = trainingDataService.getTrainingDataStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Trigger retrain - chỉ dùng unused reviews
     */
    @PostMapping("/retrain-unused")
    public ResponseEntity<?> retrainWithUnused() {
        try {
            System.out.println("🚀 Admin initiated retrain with unused reviews");
            Map<String, Object> result = trainingDataService.triggerRetrain(false);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    /**
     * Trigger retrain - sử dụng tất cả reviews
     */
    @PostMapping("/retrain-all")
    public ResponseEntity<?> retrainWithAll() {
        try {
            System.out.println("🚀 Admin initiated retrain with ALL reviews");
            Map<String, Object> result = trainingDataService.triggerRetrain(true);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    /**
     * Lấy danh sách unused reviews
     */
    @GetMapping("/unused-reviews")
    public ResponseEntity<?> getUnusedReviews() {
        try {
            var reviews = trainingDataService.getUnusedReviewedCases();
            return ResponseEntity.ok(Map.of(
                    "count", reviews.size(),
                    "reviews", reviews));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
