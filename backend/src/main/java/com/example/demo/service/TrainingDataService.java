package com.example.demo.service;

import com.example.demo.entity.DiagnosisHistory;
import com.example.demo.entity.ExpertReview;
import com.example.demo.repository.DiagnosisRepository;
import com.example.demo.repository.ExpertReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.core.io.FileSystemResource;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TrainingDataService {

    @Autowired
    private ExpertReviewRepository expertReviewRepository;

    @Autowired
    private DiagnosisRepository diagnosisRepository;

    /**
     * Lấy danh sách các reviewed cases chưa được sử dụng cho training
     */
    public List<ExpertReview> getUnusedReviewedCases() {
        return expertReviewRepository.findByIsUsedForTrainingFalse()
                .stream()
                .sorted((a, b) -> b.getReviewedAt().compareTo(a.getReviewedAt()))
                .collect(Collectors.toList());
    }

    /**
     * Lấy tất cả reviewed cases
     */
    public List<ExpertReview> getAllReviewedCases() {
        return expertReviewRepository.findAll()
                .stream()
                .filter(r -> r.getFinalLabel() != null)
                .sorted((a, b) -> b.getReviewedAt().compareTo(a.getReviewedAt()))
                .collect(Collectors.toList());
    }

    /**
     * Trigger retrain model với data từ expert reviews
     */
    public Map<String, Object> triggerRetrain(boolean useAllReviews) {
        try {
            System.out.println("🔄 Starting model retrain...");

            // Lấy data
            List<ExpertReview> reviews = useAllReviews ? getAllReviewedCases() : getUnusedReviewedCases();

            if (reviews.isEmpty()) {
                return Map.of(
                        "success", false,
                        "message", "Không có dữ liệu review để huấn luyện");
            }

            System.out.println("📊 Found " + reviews.size() + " reviewed cases");

            // Chuẩn bị files và labels
            List<File> imageFiles = new ArrayList<>();
            List<String> labels = new ArrayList<>();

            int sucessCount = 0;
            for (ExpertReview review : reviews) {
                try {
                    DiagnosisHistory diagnosis = review.getDiagnosis();
                    String imagePath = "D:/TieuLuan/pneumonia-diagnosis-system/backend" + diagnosis.getImagePath();

                    File imageFile = new File(imagePath);
                    if (imageFile.exists() && imageFile.isFile()) {
                        imageFiles.add(imageFile);
                        labels.add(review.getFinalLabel());
                        sucessCount++;
                        System.out.println("✅ " + imagePath);
                    } else {
                        System.out.println("⚠️ File not found: " + imagePath);
                    }
                } catch (Exception e) {
                    System.out.println("❌ Error processing review " + review.getId() + ": " + e.getMessage());
                }
            }

            if (imageFiles.isEmpty()) {
                return Map.of(
                        "success", false,
                        "message", "Không tìm thấy file ảnh nào");
            }

            System.out.println("📦 Prepared " + imageFiles.size() + " files for training");

            // Gửi tới AI service
            Map<String, Object> retrainResult = callAiServiceRetrain(imageFiles, labels);

            // Nếu retrain thành công, cập nhật flag
            if ((Boolean) retrainResult.getOrDefault("success", false)) {
                System.out.println("🔄 Updating training flags...");

                // Cập nhật isUsedForTraining cho các reviews đã dùng
                for (int i = 0; i < imageFiles.size(); i++) {
                    try {
                        ExpertReview review = reviews.get(i);
                        review.setIsUsedForTraining(true);
                        expertReviewRepository.save(review);
                    } catch (Exception e) {
                        System.out.println("⚠️ Could not update review " + i + ": " + e.getMessage());
                    }
                }

                System.out.println("✅ Updated " + imageFiles.size() + " reviews as used for training");
            }

            return retrainResult;

        } catch (Exception e) {
            e.printStackTrace();
            return Map.of(
                    "success", false,
                    "error", e.getMessage());
        }
    }

    /**
     * Gửi data tới AI service để retrain
     */
    private Map<String, Object> callAiServiceRetrain(List<File> imageFiles, List<String> labels) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String aiUrl = "http://localhost:8000/retrain";

            // Tạo multipart request
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

            // Thêm files
            for (File file : imageFiles) {
                body.add("files", new FileSystemResource(file));
            }

            // Thêm labels dưới dạng JSON
            ObjectMapper mapper = new ObjectMapper();
            String labelsJson = mapper.writeValueAsString(labels);
            body.add("labels", labelsJson);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            System.out.println("📤 Sending request to " + aiUrl);
            ResponseEntity<String> response = restTemplate.postForEntity(aiUrl, requestEntity, String.class);

            System.out.println("📥 Response: " + response.getBody());

            Map<String, Object> result = mapper.readValue(response.getBody(), Map.class);
            return result;

        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("❌ Error calling AI service: " + e.getMessage());
            return Map.of(
                    "success", false,
                    "error", "Không thể gọi AI service: " + e.getMessage());
        }
    }

    /**
     * Lấy thống kê về training data
     */
    public Map<String, Object> getTrainingDataStats() {
        try {
            List<ExpertReview> allReviews = expertReviewRepository.findAll();
            long usedCount = allReviews.stream().filter(r -> r.getIsUsedForTraining()).count();
            long unusedCount = allReviews.size() - usedCount;

            // Đếm theo label
            long pneumoniaCount = allReviews.stream()
                    .filter(r -> "Pneumonia".equals(r.getFinalLabel()))
                    .count();
            long normalCount = allReviews.size() - pneumoniaCount;

            return Map.of(
                    "totalReviews", allReviews.size(),
                    "usedForTraining", usedCount,
                    "unusedForTraining", unusedCount,
                    "pneumoniaCount", pneumoniaCount,
                    "normalCount", normalCount);
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("error", e.getMessage());
        }
    }
}
