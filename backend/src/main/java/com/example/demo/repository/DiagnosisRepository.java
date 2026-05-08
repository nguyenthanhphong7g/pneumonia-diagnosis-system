package com.example.demo.repository;

import com.example.demo.entity.DiagnosisHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiagnosisRepository extends JpaRepository<DiagnosisHistory, Long> {

       // Lịch sử chẩn đoán của người dùng
       List<DiagnosisHistory> findByUserIdOrderByCreatedAtDesc(Long userId);

       // Tìm tất cả ca CHƯA được bác sĩ review
       @Query("SELECT d FROM DiagnosisHistory d WHERE NOT EXISTS " +
                     "(SELECT e FROM ExpertReview e WHERE e.diagnosis.id = d.id)")
       List<DiagnosisHistory> findDiagnosesWithoutReview();

       // Tìm tất cả ca ĐÃ được bác sĩ review
       @Query("SELECT d FROM DiagnosisHistory d WHERE EXISTS " +
                     "(SELECT e FROM ExpertReview e WHERE e.diagnosis.id = d.id)")
       List<DiagnosisHistory> findDiagnosesWithReview();

       int deleteAllByUserId(Long userId);

       
}
