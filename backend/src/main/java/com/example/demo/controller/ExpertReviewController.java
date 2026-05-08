package com.example.demo.controller;

import com.example.demo.entity.DiagnosisHistory;
import com.example.demo.entity.ExpertReview;
import com.example.demo.entity.User;
import com.example.demo.repository.DiagnosisRepository;
import com.example.demo.repository.ExpertReviewRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.TrainingDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/review")
public class ExpertReviewController {

    @Autowired
    private ExpertReviewRepository expertReviewRepository;

    @Autowired
    private DiagnosisRepository diagnosisRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TrainingDataService trainingDataService;

    // API 1: Lấy danh sách ca cần review (chưa có review)
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingReviews() {
        try {
            List<DiagnosisHistory> pending = diagnosisRepository.findDiagnosesWithoutReview();

            if (pending.isEmpty()) {
                return ResponseEntity.ok(Map.of("message", "Không có ca nào cần review"));
            }

            return ResponseEntity.ok(pending);

        } catch (Exception e) {
            e.printStackTrace(); // In lỗi ra console
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Lỗi server",
                    "message", e.getMessage()));
        }
    }

    // API 2: Bác sĩ submit review
    @PostMapping("/submit")
    public ResponseEntity<?> submitReview(@RequestBody Map<String, Object> request) {
        try {
            // Validate input
            if (request.get("diagnosisId") == null || request.get("doctorId") == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "diagnosisId và doctorId không được để trống"));
            }

            Long diagnosisId = Long.valueOf(request.get("diagnosisId").toString());
            Long doctorId = Long.valueOf(request.get("doctorId").toString());
            String finalLabel = (String) request.get("finalLabel");
            String doctorComment = (String) request.get("doctorComment");

            DiagnosisHistory diagnosis = diagnosisRepository.findById(diagnosisId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy ca chẩn đoán ID: " + diagnosisId));

            User doctor = userRepository.findById(doctorId)
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy bác sĩ ID: " + doctorId + ". Vui lòng kiểm tra danh sách bác sĩ hợp lệ."));

            // Kiểm tra xem ca này đã có review chưa
            if (expertReviewRepository.findByDiagnosisId(diagnosisId).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ca này đã được review"));
            }

            ExpertReview review = new ExpertReview();
            review.setDiagnosis(diagnosis);
            review.setDoctor(doctor);
            review.setFinalLabel(finalLabel);
            review.setDoctorComment(doctorComment);
            review.setReviewedAt(LocalDateTime.now());
            review.setIsUsedForTraining(false);

            expertReviewRepository.save(review);

            return ResponseEntity.ok(Map.of(
                    "message", "Review thành công!",
                    "reviewId", review.getId()));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // API 3: Lấy danh sách reviews chưa được dùng cho training
    @GetMapping("/unused-for-training")
    public ResponseEntity<?> getUnusedReviews() {
        try {
            List<ExpertReview> unused = trainingDataService.getUnusedReviewedCases();
            return ResponseEntity.ok(Map.of(
                    "count", unused.size(),
                    "reviews", unused));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // API 4: Lấy thống kê training data
    @GetMapping("/training-data-stats")
    public ResponseEntity<?> getTrainingDataStats() {
        try {
            Map<String, Object> stats = trainingDataService.getTrainingDataStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // API 5: Lấy lịch sử review của bác sĩ hiện tại
    @GetMapping("/my-history")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyReviewHistory(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.replace("Bearer ", "").trim();
            Long doctorId = jwtUtil.extractUserId(jwt);

            List<ExpertReview> reviews = expertReviewRepository.findByDoctorIdOrderByReviewedAtDesc(doctorId);

            List<Map<String, Object>> result = reviews.stream().map(review -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", review.getId());
                item.put("reviewedAt", review.getReviewedAt());
                item.put("finalLabel", review.getFinalLabel());
                item.put("doctorComment", review.getDoctorComment());
                item.put("doctorName", review.getDoctor() != null ? review.getDoctor().getUsername() : null);

                DiagnosisHistory diagnosis = review.getDiagnosis();
                if (diagnosis != null) {
                    item.put("diagnosisId", diagnosis.getId());
                    item.put("imagePath", diagnosis.getImagePath());
                    item.put("label", diagnosis.getLabel());
                    item.put("confidence", diagnosis.getConfidence());
                    item.put("createdAt", diagnosis.getCreatedAt());
                }

                return item;
            }).toList();

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    // API 5: Trigger retrain model với unused reviews
    @PostMapping("/trigger-retrain")
    public ResponseEntity<?> triggerRetrain(@RequestParam(defaultValue = "false") boolean useAllReviews) {
        try {
            System.out.println("🔄 Trigger retrain endpoint called");
            System.out.println("useAllReviews: " + useAllReviews);

            Map<String, Object> result = trainingDataService.triggerRetrain(useAllReviews);

            if ((Boolean) result.getOrDefault("success", false)) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.status(400).body(result);
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    // API 6: Manual retrain dengan custom dataset (admin only)
    @PostMapping("/manual-retrain")
    public ResponseEntity<?> manualRetrain(@RequestParam boolean useAllReviews) {
        try {
            Map<String, Object> result = trainingDataService.triggerRetrain(useAllReviews);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
