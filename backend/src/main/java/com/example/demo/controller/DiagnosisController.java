package com.example.demo.controller;

import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entity.DiagnosisHistory;
import com.example.demo.entity.ExpertReview;
import com.example.demo.entity.User;
import com.example.demo.repository.DiagnosisRepository;
import com.example.demo.repository.ExpertReviewRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class DiagnosisController {

    @Autowired
    private DiagnosisRepository diagnosisRepository;

    @Autowired
    private ExpertReviewRepository expertReviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/diagnosis/predict")
    public ResponseEntity<?> predict(@RequestParam("file") MultipartFile file,
            @RequestHeader("Authorization") String token) {

        try {
            // Lấy userId từ token
            String jwt = token.replace("Bearer ", "").trim();
            Long userId = jwtUtil.extractUserId(jwt);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User không tồn tại"));

            // ==================== LƯU ẢNH VÀO THƯ MỤC UPLOADS ====================
            String uploadDir = "D:/TieuLuan/pneumonia-diagnosis-system/backend/uploads/";
            java.io.File uploadFolder = new java.io.File(uploadDir);
            if (!uploadFolder.exists()) {
                uploadFolder.mkdirs();
            }

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            java.io.File dest = new java.io.File(uploadDir + fileName);

            // Lưu file an toàn (tránh lỗi temp file của Tomcat)
            try (var inputStream = file.getInputStream();
                    var outputStream = new java.io.FileOutputStream(dest)) {
                inputStream.transferTo(outputStream);
            }

            // Gọi AI Service
            RestTemplate restTemplate = new RestTemplate();
            String aiUrl = "http://localhost:8000/predict";

            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<String> aiResponse = restTemplate.postForEntity(aiUrl, requestEntity, String.class);

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> aiResult = mapper.readValue(aiResponse.getBody(), Map.class);

            String label = (String) aiResult.get("label");
            Double confidence = Double.parseDouble(aiResult.get("confidence").toString());

            // Rule nghiệp vụ: confidence tiệm cận 100% thường là ảnh không hợp lệ cho đầu vào X-quang.
            // Dùng ngưỡng 99.99% để tránh lỗi so sánh số thực tuyệt đối.
            if (confidence != null && confidence >= 0.98) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Ảnh đầu vào có vẻ không phải ảnh X-quang phổi hợp lệ. Vui lòng chọn lại ảnh.",
                        "code", "INVALID_XRAY_INPUT",
                        "confidence", confidence));
            }

            // Lưu vào Database
            DiagnosisHistory history = new DiagnosisHistory();
            history.setUser(user);
            history.setImagePath("/uploads/" + fileName);
            history.setLabel(label);
            history.setConfidence(confidence);
            history.setCreatedAt(LocalDateTime.now());

            diagnosisRepository.save(history);

            Map<String, Object> result = new HashMap<>();
            result.put("id", history.getId());
            result.put("label", label);
            result.put("confidence", confidence);
            result.put("message", "Dự đoán thành công");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== HISTORY ENDPOINTS ====================
    @GetMapping("/history")
    public ResponseEntity<List<DiagnosisHistory>> getHistory(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.replace("Bearer ", "").trim();
            Long userId = jwtUtil.extractUserId(jwt);

            List<DiagnosisHistory> history = diagnosisRepository.findByUserIdOrderByCreatedAtDesc(userId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401).body(null);
        }
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<?> deleteHistory(@PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        try {
            String jwt = token.replace("Bearer ", "").trim();
            Long userId = jwtUtil.extractUserId(jwt);

            DiagnosisHistory record = diagnosisRepository.findById(id).orElse(null);
            if (record == null || record.getUser() == null || !record.getUser().getId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Không có quyền xóa"));
            }

            diagnosisRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa thành công"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/history/clear")
    @Transactional
    public ResponseEntity<?> clearAllHistory(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.replace("Bearer ", "").trim();
            Long userId = jwtUtil.extractUserId(jwt);

            diagnosisRepository.deleteAllByUserId(userId);
            return ResponseEntity.ok(Map.of("message", "Đã xóa toàn bộ lịch sử thành công"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== SERVE UPLOADED IMAGES ====================
    @GetMapping("/uploads")
    public ResponseEntity<Resource> getUploadedImage(@RequestParam("file") String fileName) {
        try {
            System.out.println("=== SERVE IMAGE DEBUG ===");
            System.out.println("Requested file: " + fileName);

            String uploadDir = "D:/TieuLuan/pneumonia-diagnosis-system/backend/uploads/";
            String filePath = uploadDir + fileName;
            System.out.println("Full path: " + filePath);

            java.io.File file = new java.io.File(filePath);
            System.out.println("File exists: " + file.exists());
            System.out.println("Is file: " + file.isFile());
            System.out.println("Can read: " + file.canRead());

            if (!file.exists() || !file.isFile()) {
                System.out.println("FILE NOT FOUND!");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            Resource resource = new FileSystemResource(file);

            // Xác định MIME type
            MediaType mediaType = MediaType.IMAGE_JPEG;
            if (fileName.endsWith(".png")) {
                mediaType = MediaType.IMAGE_PNG;
            } else if (fileName.endsWith(".gif")) {
                mediaType = MediaType.IMAGE_GIF;
            }

            System.out.println("Serving file with mediaType: " + mediaType);
            return ResponseEntity
                    .ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .body(resource);
        } catch (Exception e) {
            System.out.println("ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==================== NEW ENDPOINT: HISTORY WITH REVIEWS ====================
    @GetMapping("/history-with-reviews")
    public ResponseEntity<?> getHistoryWithReviews(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.replace("Bearer ", "").trim();
            Long userId = jwtUtil.extractUserId(jwt);

            List<DiagnosisHistory> historyList = diagnosisRepository.findByUserIdOrderByCreatedAtDesc(userId);

            // Tạo danh sách kết quả với review data
            List<Map<String, Object>> result = historyList.stream().map(diagnosis -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", diagnosis.getId());
                item.put("imagePath", diagnosis.getImagePath());
                item.put("aiLabel", diagnosis.getLabel());
                item.put("label", diagnosis.getLabel());
                item.put("confidence", diagnosis.getConfidence());
                item.put("createdAt", diagnosis.getCreatedAt());
                item.put("userId", diagnosis.getUser() != null ? diagnosis.getUser().getId() : null);

                // Kiểm tra xem có review không
                var review = expertReviewRepository.findByDiagnosisId(diagnosis.getId());
                if (review.isPresent()) {
                    ExpertReview expertReview = review.get();
                    item.put("reviewed", true);
                    item.put("label", expertReview.getFinalLabel());
                    item.put("finalLabel", expertReview.getFinalLabel());
                    item.put("doctorComment", expertReview.getDoctorComment());
                    item.put("reviewedAt", expertReview.getReviewedAt());
                    item.put("doctorName",
                            expertReview.getDoctor() != null ? expertReview.getDoctor().getUsername() : "Unknown");
                } else {
                    item.put("reviewed", false);
                    item.put("finalLabel", null);
                    item.put("doctorComment", null);
                    item.put("reviewedAt", null);
                    item.put("doctorName", null);
                }

                return item;
            }).toList();

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401).body(null);
        }
    }

    // ==================== NEW ENDPOINT: DIAGNOSIS STATISTICS ====================
    @GetMapping("/diagnosis-stats")
    public ResponseEntity<?> getDiagnosisStats(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.replace("Bearer ", "").trim();
            Long userId = jwtUtil.extractUserId(jwt);

            // Check if user is admin
            var userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty() || !userOpt.get().getRole().equals("ADMIN")) {
                return ResponseEntity.status(403).body("Unauthorized");
            }

            // Get all diagnoses
            List<DiagnosisHistory> allDiagnoses = diagnosisRepository.findAll();

            // Create result list with review status
            List<Map<String, Object>> result = allDiagnoses.stream().map(diagnosis -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", diagnosis.getId());
                item.put("imagePath", diagnosis.getImagePath());
                item.put("aiLabel", diagnosis.getLabel());
                item.put("label", diagnosis.getLabel());
                item.put("confidence", diagnosis.getConfidence());
                item.put("createdAt", diagnosis.getCreatedAt());
                item.put("userId", diagnosis.getUser() != null ? diagnosis.getUser().getId() : null);

                // Check if diagnosis has been reviewed
                var review = expertReviewRepository.findByDiagnosisId(diagnosis.getId());
                if (review.isPresent()) {
                    ExpertReview expertReview = review.get();
                    item.put("reviewed", true);
                    item.put("label", expertReview.getFinalLabel());
                    item.put("finalLabel", expertReview.getFinalLabel());
                    item.put("doctorComment", expertReview.getDoctorComment());
                    item.put("reviewedAt", expertReview.getReviewedAt());
                    item.put("doctorName",
                            expertReview.getDoctor() != null ? expertReview.getDoctor().getUsername() : "Unknown");
                } else {
                    item.put("reviewed", false);
                    item.put("finalLabel", null);
                    item.put("doctorComment", null);
                    item.put("reviewedAt", null);
                    item.put("doctorName", null);
                }

                return item;
            }).toList();

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401).body(null);
        }
    }

}