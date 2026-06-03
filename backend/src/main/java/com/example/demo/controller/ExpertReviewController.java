package com.example.demo.controller;

import com.example.demo.entity.DiagnosisHistory;
import com.example.demo.entity.ExpertReview;
import com.example.demo.entity.User;
import com.example.demo.entity.ModelMetrics;
import com.example.demo.repository.DiagnosisRepository;
import com.example.demo.repository.ExpertReviewRepository;
import com.example.demo.repository.ModelMetricsRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.TrainingDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
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
    private ModelMetricsRepository modelMetricsRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TrainingDataService trainingDataService;

    private String resolveModelName(Integer modelId) {
        if (modelId == null) {
            return null;
        }

        return modelMetricsRepository.findById(modelId)
                .map(ModelMetrics::getModelName)
                .orElse(null);
    }

    private void enrichModelName(DiagnosisHistory diagnosis) {
        if (diagnosis == null) {
            return;
        }

        diagnosis.setModelName(resolveModelName(diagnosis.getModelId()));
    }

    // API 1: Lấy danh sách ca cần review (chưa có review)
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingReviews() {
        try {
            List<DiagnosisHistory> pending = diagnosisRepository.findDiagnosesWithoutReview();
            pending.forEach(this::enrichModelName);

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

            List<ExpertReview> history = expertReviewRepository.findByDoctorIdOrderByReviewedAtDesc(doctorId);
            // Enrich model name for each diagnosis in the history
            history.forEach(review -> enrichModelName(review.getDiagnosis()));

            return ResponseEntity.ok(history);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // API: Lấy thống kê tổng quát cho dashboard bác sĩ
    @GetMapping("/stats-summary")
    public ResponseEntity<?> getStatsSummary(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.replace("Bearer ", "").trim();
            Long doctorId = jwtUtil.extractUserId(jwt);
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

            // 1. Tổng số ca đã duyệt bởi bác sĩ này
            long totalReviewed = expertReviewRepository.countByDoctorId(doctorId);

            // 2. Số ca duyệt trong ngày
            long todayCompleted = expertReviewRepository.countByDoctorIdAndReviewedAtBetween(doctorId,
                    startOfDay, endOfDay);

            // 3. Số ca đang chờ duyệt (toàn hệ thống)
            long pendingCount = diagnosisRepository.countDiagnosesWithoutReview();

            // 4. Tính Agree Rate (Số ca bác sĩ kết luận giống AI / Tổng số ca bác sĩ đã
            // duyệt)
            List<ExpertReview> reviews = expertReviewRepository.findByDoctorIdOrderByReviewedAtDesc(doctorId);
            long agreedCount = reviews.stream()
                    .filter(r -> r.getDiagnosis() != null && r.getFinalLabel() != null &&
                            r.getFinalLabel().equalsIgnoreCase(r.getDiagnosis().getLabel()))
                    .count();

            double agreeRate = totalReviewed > 0 ? (double) agreedCount / totalReviewed * 100 : 0;

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalReviewed", totalReviewed);
            stats.put("todayCompleted", todayCompleted);
            stats.put("pending", pendingCount);
            stats.put("agreeRate", Math.round(agreeRate * 10) / 10.0);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // API: Lấy thống kê số ca đã duyệt trong ngày
    @GetMapping("/count-today")
    public ResponseEntity<?> getTodayReviewCount(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.replace("Bearer ", "").trim();
            Long doctorId = jwtUtil.extractUserId(jwt);
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

            long count = expertReviewRepository.countByDoctorIdAndReviewedAtBetween(doctorId,
                    startOfDay, endOfDay);

            Map<String, Object> result = new HashMap<>();
            result.put("count", count);
            result.put("date", java.time.LocalDate.now());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
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
