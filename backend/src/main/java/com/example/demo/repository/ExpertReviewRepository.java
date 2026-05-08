package com.example.demo.repository;

import com.example.demo.entity.ExpertReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpertReviewRepository extends JpaRepository<ExpertReview, Long> {

    // Tìm review theo diagnosis
    Optional<ExpertReview> findByDiagnosisId(Long diagnosisId);

    // Lấy danh sách các review chưa được sử dụng cho training
    List<ExpertReview> findByIsUsedForTrainingFalse();

    // Lấy danh sách các review đã được sử dụng cho training
    List<ExpertReview> findByIsUsedForTrainingTrue();

    // Lấy tất cả review của một bác sĩ
    List<ExpertReview> findByDoctorIdOrderByReviewedAtDesc(Long doctorId);
}