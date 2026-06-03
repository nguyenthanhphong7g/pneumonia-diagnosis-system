package com.example.demo.repository;

import com.example.demo.entity.ExpertReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import org.springframework.data.repository.query.Param;

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

    // Đếm tổng số ca đã review của bác sĩ
    long countByDoctorId(Long doctorId);

    // Đếm số lượng ca đã review trong một khoảng thời gian của bác sĩ
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(e) FROM ExpertReview e WHERE e.doctor.id = :doctorId AND e.reviewedAt BETWEEN :startTime AND :endTime")
    long countByDoctorIdAndReviewedAtBetween(
            @Param("doctorId") Long doctorId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    // Tính tỷ lệ đồng thuận (Agree Rate) của bác sĩ
    @org.springframework.data.jpa.repository.Query("SELECT " +
            "100.0 * SUM(CASE WHEN e.diagnosis.label = e.finalLabel THEN 1 ELSE 0 END) / COUNT(e) " +
            "FROM ExpertReview e WHERE e.doctor.id = :doctorId")
    Double calculateAgreeRateByDoctorId(Long doctorId);
}