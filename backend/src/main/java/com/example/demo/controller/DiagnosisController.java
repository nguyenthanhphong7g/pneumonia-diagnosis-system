package com.example.demo.controller;

import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entity.DiagnosisHistory;
import com.example.demo.entity.ExpertReview;
import com.example.demo.entity.User;
import com.example.demo.entity.ModelMetrics;
import com.example.demo.repository.DiagnosisRepository;
import com.example.demo.repository.ExpertReviewRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.ModelMetricsRepository;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.ModelMetricsService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import java.nio.charset.StandardCharsets;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class DiagnosisController {
    private static final long MAX_UPLOAD_SIZE_BYTES = 10L * 1024 * 1024; // 10 MB
    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png");

    @Autowired
    private DiagnosisRepository diagnosisRepository;

    @Autowired
    private ExpertReviewRepository expertReviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModelMetricsService modelMetricsService;

    @Autowired
    private ModelMetricsRepository modelMetricsRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${ai.service.predict-url}")
    private String aiPredictUrl;

    @Value("${ai.service.predict-fallback-urls}")
    private String aiPredictFallbackUrls;

    @Value("${ai.service.gradcam-url}")
    private String aiGradcamUrl;

    @Value("${ai.service.gradcam-fallback-urls}")
    private String aiGradcamFallbackUrls;

    private List<String> buildUrlList(String primaryUrl, String fallbackUrls) {
        List<String> urls = new java.util.ArrayList<>();
        urls.add(primaryUrl);
        for (String url : fallbackUrls.split(",")) {
            String trimmedUrl = url.trim();
            if (!trimmedUrl.isEmpty() && !urls.contains(trimmedUrl)) {
                urls.add(trimmedUrl);
            }
        }
        return urls;
    }

    private Long extractUserIdFromToken(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }

        String jwt = token.replace("Bearer ", "").trim();
        if (jwt.isBlank()) {
            return null;
        }

        try {
            return jwtUtil.extractUserId(jwt);
        } catch (Exception e) {
            return null;
        }
    }

    private Double parseConfidence(Object confObj) {
        if (confObj == null) {
            return 0.0;
        }

        try {
            return Double.parseDouble(confObj.toString());
        } catch (Exception e) {
            System.out.println("[PREDICT] Warning: could not parse confidence from AI response; defaulting to 0.0");
            return 0.0;
        }
    }

    private ModelMetrics resolveModelMetrics(String modelName) {
        if (modelName == null || modelName.isBlank()) {
            return null;
        }

        String normalizedName = modelName.trim().toLowerCase();

        // Chuẩn hóa tên từ AI/Frontend thành tên chuẩn trong Database
        if (normalizedName.equals("densenet")) {
            normalizedName = "densenet169";
        } else if (normalizedName.equals("vit_logistic")) {
            normalizedName = "vit";
        } else if (normalizedName.equals("random_forest") || normalizedName.equals("rf")) {
            normalizedName = "gated_fusion";
        }

        // Bọc lại bằng original name nếu cần, nhưng DB cần tên chuẩn
        return modelMetricsRepository.findByModelName(normalizedName).orElse(null);
    }

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

    private String saveGradcamBytes(byte[] bytes, String uploadDir, String extension) throws Exception {
        if (bytes == null || bytes.length == 0) {
            return null;
        }

        String gradcamDir = uploadDir + "gradcams/";
        java.io.File gdir = new java.io.File(gradcamDir);
        if (!gdir.exists()) {
            gdir.mkdirs();
        }

        String safeExtension = (extension == null || extension.isBlank()) ? ".png" : extension;
        if (!safeExtension.startsWith(".")) {
            safeExtension = "." + safeExtension;
        }

        String gradcamFileName = System.currentTimeMillis() + "_gradcam" + safeExtension;
        java.io.File gdest = new java.io.File(gradcamDir + gradcamFileName);
        try (var os = new java.io.FileOutputStream(gdest)) {
            os.write(bytes);
        }
        return "/uploads/gradcams/" + gradcamFileName;
    }

    private String saveGradcamBase64(String gradcamBase64, String uploadDir) throws Exception {
        if (gradcamBase64 == null || gradcamBase64.isBlank()) {
            return null;
        }

        String normalized = gradcamBase64.trim();
        if (normalized.contains(",")) {
            normalized = normalized.substring(normalized.indexOf(',') + 1);
        }

        byte[] decoded = java.util.Base64.getDecoder().decode(normalized);
        return saveGradcamBytes(decoded, uploadDir, ".png");
    }

    private String requestAndSaveGradcam(MultipartFile file, RestTemplate restTemplate, String uploadDir) {
        try {
            List<String> gradcamUrls = buildUrlList(aiGradcamUrl, aiGradcamFallbackUrls);

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

            ResponseEntity<byte[]> aiResponse = null;
            Exception lastGradcamError = null;
            for (String aiUrl : gradcamUrls) {
                try {
                    aiResponse = restTemplate.postForEntity(aiUrl, requestEntity, byte[].class);
                    System.out.println("[GRADCAM] AI service selected: " + aiUrl);
                    break;
                } catch (Exception ex) {
                    lastGradcamError = ex;
                    System.out.println("[GRADCAM] AI service failed: " + aiUrl + " | " + ex.getMessage());
                }
            }

            if (aiResponse == null) {
                if (lastGradcamError != null) {
                    lastGradcamError.printStackTrace();
                }
                return null;
            }

            MediaType contentType = aiResponse.getHeaders().getContentType();
            if (contentType == null || aiResponse.getBody() == null || aiResponse.getBody().length == 0) {
                System.out.println("[GRADCAM] Empty or missing image response from AI service");
                return null;
            }

            String extension = ".jpg";
            if (contentType.includes(MediaType.IMAGE_PNG)) {
                extension = ".png";
            } else if (contentType.includes(MediaType.IMAGE_GIF)) {
                extension = ".gif";
            }

            return saveGradcamBytes(aiResponse.getBody(), uploadDir, extension);
        } catch (Exception e) {
            System.out.println("[GRADCAM] Warning: failed to generate and save gradcam: " + e.getMessage());
            return null;
        }
    }

    @PostMapping("/diagnosis/predict")
    public ResponseEntity<?> predict(@RequestParam("file") MultipartFile file,
            @RequestParam(value = "model", required = false) String model,
            @RequestHeader(value = "Authorization", required = false) String token) {

        try {
            // Lấy userId từ token
            Long userId = extractUserIdFromToken(token);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Thiếu hoặc không hợp lệ Authorization header"));
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User không tồn tại"));

            // Validate upload file before saving.
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Tên file không hợp lệ"));
            }

            String lowerFilename = originalFilename.toLowerCase();
            int idx = lowerFilename.lastIndexOf('.');
            if (idx < 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Chỉ chấp nhận định dạng ảnh: jpg, jpeg, png"));
            }

            String extension = lowerFilename.substring(idx + 1);
            if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Chỉ chấp nhận định dạng ảnh: jpg, jpeg, png"));
            }

            if (file.getSize() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "File ảnh không được để trống"));
            }

            if (file.getSize() > MAX_UPLOAD_SIZE_BYTES) {
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                        .body(Map.of("error", "Kích thước file vượt quá 10 MB"));
            }

            // ==================== LƯU ẢNH VÀO THƯ MỤC UPLOADS ====================
            String uploadDir = "D:/TieuLuan/pneumonia-diagnosis-system/backend/uploads/";
            java.io.File uploadFolder = new java.io.File(uploadDir);
            if (!uploadFolder.exists()) {
                uploadFolder.mkdirs();
            }

            String safeFilename = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
            String fileName = System.currentTimeMillis() + "_" + safeFilename;
            java.io.File dest = new java.io.File(uploadDir + fileName);

            // Lưu file an toàn (tránh lỗi temp file của Tomcat)
            try (var inputStream = file.getInputStream();
                    var outputStream = new java.io.FileOutputStream(dest)) {
                inputStream.transferTo(outputStream);
            }

            // Gọi AI Service (cấu hình tập trung trong application.properties)
            RestTemplate restTemplate = new RestTemplate();
            List<String> predictUrls = buildUrlList(aiPredictUrl, aiPredictFallbackUrls);

            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);
            if (model != null && !model.isBlank()) {
                body.add("model", model.trim());
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<String> aiResponse = null;
            Exception lastPredictError = null;
            for (String aiUrl : predictUrls) {
                try {
                    aiResponse = restTemplate.postForEntity(aiUrl, requestEntity, String.class);

                    if (aiResponse == null) {
                        System.out.println("[PREDICT] No response object returned from AI service: " + aiUrl);
                        continue;
                    }

                    // safe-status logging
                    String statusLog = "unknown";
                    try {
                        HttpStatusCode status = aiResponse.getStatusCode();
                        if (status != null) {
                            statusLog = status.toString();
                        }
                    } catch (Exception eStatus) {
                        statusLog = "(status read error)";
                    }

                    System.out.println("[PREDICT] AI service responded: " + aiUrl + " | status=" + statusLog);

                    // Quick check: if AI returned an error payload, treat as failure and try next
                    // URL
                    try {
                        String bodyStr = aiResponse.getBody();
                        if (bodyStr != null && !bodyStr.isBlank()) {
                            ObjectMapper tmpMapper = new ObjectMapper();
                            Map<String, Object> tmp = tmpMapper.readValue(bodyStr, Map.class);
                            if (tmp.containsKey("error") && tmp.get("error") != null) {
                                lastPredictError = new Exception("AI returned error: " + tmp.get("error").toString());
                                System.out.println("[PREDICT] AI service returned error payload: " + tmp.get("error"));
                                continue; // try next URL
                            }
                        } else {
                            // empty body — log and continue trying other URLs
                            System.out.println("[PREDICT] AI service returned empty body: " + aiUrl);
                            continue;
                        }
                    } catch (Exception eparse) {
                        // ignore parse errors here and proceed to use aiResponse below
                        System.out.println("[PREDICT] Could not parse AI response body as JSON (will try to use it): "
                                + eparse.getMessage());
                    }

                    System.out.println("[PREDICT] AI service selected: " + aiUrl);
                    break;
                } catch (Exception ex) {
                    lastPredictError = ex;
                    System.out.println("[PREDICT] AI service failed: " + aiUrl + " | " + ex.getMessage());
                }
            }
            if (aiResponse == null) {
                if (lastPredictError != null) {
                    lastPredictError.printStackTrace();
                }
                Map<String, Object> err = new HashMap<>();
                err.put("error", "AI service unreachable");
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(err);
            }

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> aiResult = mapper.readValue(aiResponse.getBody(), Map.class);

            if (aiResult.containsKey("error") && aiResult.get("error") != null) {
                throw new RuntimeException("AI returned error: " + aiResult.get("error").toString());
            }

            String label = aiResult.get("label") != null ? aiResult.get("label").toString() : null;
            if (label == null || label.isBlank()) {
                throw new RuntimeException("AI response missing label");
            }

            // Safely parse confidence; default to 0.0 when missing or invalid
            Double confidence = parseConfidence(aiResult.get("confidence"));

            // Parse inference_time_ms
            Integer inferenceTimeMs = 0;
            if (aiResult.containsKey("inference_time_ms") && aiResult.get("inference_time_ms") != null) {
                try {
                    inferenceTimeMs = Integer.parseInt(aiResult.get("inference_time_ms").toString());
                } catch (Exception e) {
                    System.out.println("[PREDICT] Warning: could not parse inference_time_ms; defaulting to 0");
                }
            }

            Integer modelTimeMs = 0;
            if (aiResult.containsKey("model_time_ms") && aiResult.get("model_time_ms") != null) {
                try {
                    modelTimeMs = Integer.parseInt(aiResult.get("model_time_ms").toString());
                } catch (Exception e) {
                    System.out.println("[PREDICT] Warning: could not parse model_time_ms; defaulting to 0");
                }
            }

            Integer gradcamTimeMs = 0;
            if (aiResult.containsKey("gradcam_time_ms") && aiResult.get("gradcam_time_ms") != null) {
                try {
                    gradcamTimeMs = Integer.parseInt(aiResult.get("gradcam_time_ms").toString());
                } catch (Exception e) {
                    System.out.println("[PREDICT] Warning: could not parse gradcam_time_ms; defaulting to 0");
                }
            }

            // Parse detailed timing breakdown from AI service, if provided
            Map<String, Object> timingsMs = new HashMap<>();
            if (aiResult.containsKey("timings_ms") && aiResult.get("timings_ms") instanceof Map) {
                try {
                    timingsMs = new ObjectMapper().convertValue(aiResult.get("timings_ms"), Map.class);
                } catch (Exception e) {
                    System.out.println("[PREDICT] Warning: could not parse timings_ms; defaulting to empty map");
                }
            }

            // Rule nghiệp vụ: confidence tiệm cận 100% thường là ảnh không hợp lệ cho đầu
            // vào X-quang.
            // Dùng ngưỡng 99.99% để tránh lỗi so sánh số thực tuyệt đối.

            // Lưu vào Database
            DiagnosisHistory history = new DiagnosisHistory();
            history.setUser(user);
            history.setImagePath("/uploads/" + fileName);
            String requestedModelName = model != null && !model.isBlank() ? model.trim() : null;
            ModelMetrics resolvedModel = resolveModelMetrics(requestedModelName);
            if (resolvedModel == null) {
                String aiModelName = aiResult.get("model") != null ? aiResult.get("model").toString().trim() : null;
                resolvedModel = resolveModelMetrics(aiModelName);
                if (requestedModelName == null) {
                    requestedModelName = aiModelName;
                }
            }

            history.setModelId(resolvedModel != null ? resolvedModel.getModelId() : null);
            history.setModelName(resolvedModel != null ? resolvedModel.getModelName() : requestedModelName);
            history.setLabel(label);
            history.setConfidence(confidence);
            history.setInferenceTimeMs(inferenceTimeMs);
            history.setCreatedAt(LocalDateTime.now());

            // Save GradCAM from AI response when available; otherwise call the dedicated
            // endpoint.
            try {
                String gradcamPath = null;
                Object gradcamObj = aiResult.get("gradcam_base64");
                if (gradcamObj == null) {
                    gradcamObj = aiResult.get("gradcam");
                }

                if (gradcamObj != null) {
                    gradcamPath = saveGradcamBase64(gradcamObj.toString(), uploadDir);
                }

                if (gradcamPath == null) {
                    gradcamPath = requestAndSaveGradcam(file, restTemplate, uploadDir);
                }

                if (gradcamPath != null) {
                    history.setGradcamPath(gradcamPath);
                }
            } catch (Exception e) {
                System.out.println("[PREDICT] Warning: failed to save gradcam: " + e.getMessage());
            }

            diagnosisRepository.save(history);

            Map<String, Object> result = new HashMap<>();
            result.put("id", history.getId());
            result.put("label", label);
            result.put("confidence", confidence);
            result.put("modelId", history.getModelId());
            result.put("modelName", history.getModelName());
            result.put("model", model != null && !model.isBlank() ? model.trim() : aiResult.get("model"));
            if (history.getGradcamPath() != null)
                result.put("gradcamPath", history.getGradcamPath());
            result.put("inference_time_ms", inferenceTimeMs);
            result.put("model_time_ms", modelTimeMs);
            result.put("gradcam_time_ms", gradcamTimeMs);
            if (timingsMs != null && !timingsMs.isEmpty()) {
                result.put("timings_ms", timingsMs);
            }
            // propagate model used by AI service so frontend can show it
            try {
                Object modelObj = aiResult.get("model");
                if (modelObj != null)
                    result.put("model", modelObj.toString());
            } catch (Exception e) {
                // ignore
            }
            result.put("message", "Dự đoán thành công");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== HISTORY ENDPOINTS ====================
    @GetMapping("/history")
    public ResponseEntity<List<DiagnosisHistory>> getHistory(
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            Long userId = extractUserIdFromToken(token);
            if (userId == null) {
                return ResponseEntity.status(401).body(null);
            }

            List<DiagnosisHistory> history = diagnosisRepository.findByUserIdOrderByCreatedAtDesc(userId);
            history.forEach(this::enrichModelName);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401).body(null);
        }
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<?> deleteHistory(@PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            Long userId = extractUserIdFromToken(token);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Thiếu hoặc không hợp lệ Authorization header"));
            }

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
            Long userId = extractUserIdFromToken(token);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Thiếu hoặc không hợp lệ Authorization header"));
            }

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
            Long userId = extractUserIdFromToken(token);
            if (userId == null) {
                return ResponseEntity.status(401).body(null);
            }

            List<DiagnosisHistory> historyList = diagnosisRepository.findByUserIdOrderByCreatedAtDesc(userId);
            historyList.forEach(this::enrichModelName);

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
                item.put("modelId", diagnosis.getModelId());
                item.put("modelName", diagnosis.getModelName());
                item.put("gradcamPath", diagnosis.getGradcamPath());

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
            Long userId = extractUserIdFromToken(token);
            if (userId == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }

            // Check if user is admin
            var userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty() || !userOpt.get().getRole().equals("ADMIN")) {
                return ResponseEntity.status(403).body("Unauthorized");
            }

            // Get all diagnoses
            List<DiagnosisHistory> allDiagnoses = diagnosisRepository.findAll();
            allDiagnoses.forEach(this::enrichModelName);

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
                item.put("modelId", diagnosis.getModelId());
                item.put("modelName", diagnosis.getModelName());
                item.put("gradcamPath", diagnosis.getGradcamPath());

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

    // ==================== NEW ENDPOINT: GRADCAM ====================
    @PostMapping("/diagnosis/gradcam")
    public ResponseEntity<?> gradcam(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "Authorization", required = false) String token) {

        try {
            // gọi FastAPI GradCAM service (thử nhiều cổng)
            RestTemplate restTemplate = new RestTemplate();
            List<String> gradcamUrls = buildUrlList(aiGradcamUrl, aiGradcamFallbackUrls);

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

            // nhận ảnh trả về từ FastAPI (binary)
            ResponseEntity<byte[]> aiResponse = null;
            Exception lastGradcamError = null;
            for (String aiUrl : gradcamUrls) {
                try {
                    aiResponse = restTemplate.postForEntity(aiUrl, requestEntity, byte[].class);
                    System.out.println("[GRADCAM] AI service selected: " + aiUrl);
                    break;
                } catch (Exception ex) {
                    lastGradcamError = ex;
                    System.out.println("[GRADCAM] AI service failed: " + aiUrl + " | " + ex.getMessage());
                }
            }
            if (aiResponse == null) {
                if (lastGradcamError != null) {
                    lastGradcamError.printStackTrace();
                }
                Map<String, Object> err = new HashMap<>();
                err.put("error", "AI service unreachable");
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(err);
            }

            MediaType contentType = aiResponse.getHeaders().getContentType();

            if (contentType == null || !contentType.includes(MediaType.IMAGE_JPEG)) {
                // FastAPI returned an error JSON or non-image response — surface it for
                // debugging
                String bodyStr = "";
                try {
                    bodyStr = new String(aiResponse.getBody(), StandardCharsets.UTF_8);
                } catch (Exception ex) {
                    bodyStr = "<binary data>";
                }
                System.out.println("[GRADCAM] Unexpected content-type from AI service: " + contentType);
                System.out.println("[GRADCAM] Body: " + bodyStr);
                Map<String, Object> err = new HashMap<>();
                err.put("error", "AI service error");
                err.put("ai_body", bodyStr);
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(err);
            }

            // valid image response
            ByteArrayResource resultImage = new ByteArrayResource(aiResponse.getBody());

            return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(resultImage);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    // ==================== NEW ENDPOINT: COMPARE MODELS ====================
    @PostMapping("/diagnosis/compare")
    public ResponseEntity<?> compareModels(@RequestParam("file") MultipartFile file,
            @RequestParam(value = "models", required = false) String models,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            // Build compare URLs by replacing /predict -> /compare in configured URLs
            String comparePrimary = aiPredictUrl.replace("/predict", "/compare");
            String compareFallbacks = aiPredictFallbackUrls.replace("predict", "compare");
            List<String> compareUrls = buildUrlList(comparePrimary, compareFallbacks);

            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);
            if (models != null && !models.isBlank()) {
                body.add("models", models.trim());
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<String> aiResponse = null;
            Exception lastError = null;
            for (String aiUrl : compareUrls) {
                try {
                    aiResponse = restTemplate.postForEntity(aiUrl, requestEntity, String.class);
                    if (aiResponse != null)
                        break;
                } catch (Exception ex) {
                    lastError = ex;
                }
            }

            if (aiResponse == null) {
                if (lastError != null)
                    lastError.printStackTrace();
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", "AI service unreachable"));
            }

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> aiResult = mapper.readValue(aiResponse.getBody(), Map.class);
            return ResponseEntity.ok(aiResult);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== MODEL METRICS ENDPOINTS ====================

    /**
     * GET /api/models - Lấy danh sách tất cả độ đo mô hình
     */
    @GetMapping("/models")
    public ResponseEntity<?> getAllModelMetrics() {
        try {
            List<ModelMetrics> metrics = modelMetricsService.getAllModelMetrics();
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/models/{modelName} - Lấy độ đo của một mô hình cụ thể
     */
    @GetMapping("/models/{modelName}")
    public ResponseEntity<?> getModelMetrics(@PathVariable String modelName) {
        try {
            var metrics = modelMetricsService.getModelMetricsDTO(modelName);
            if (metrics == null) {
                return ResponseEntity.status(404)
                        .body(Map.of("error", "Model metrics not found: " + modelName));
            }
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/models/{modelName}/expected-runtime - Lấy thời gian chạy dự kiến
     */
    @GetMapping("/models/{modelName}/expected-runtime")
    public ResponseEntity<?> getExpectedRuntime(@PathVariable String modelName) {
        try {
            Integer runtimeMs = modelMetricsService.getExpectedRuntimeMs(modelName);
            return ResponseEntity.ok(Map.of("modelName", modelName, "expectedRuntimeMs", runtimeMs));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostConstruct
    public void init() {
        System.out.println("DiagnosisController loaded");
    }
}
