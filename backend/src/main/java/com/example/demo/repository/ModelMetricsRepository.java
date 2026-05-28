package com.example.demo.repository;

import com.example.demo.entity.ModelMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ModelMetricsRepository extends JpaRepository<ModelMetrics, Integer> {

    // Tìm metrics theo model name
    Optional<ModelMetrics> findByModelName(String modelName);

    // Kiểm tra model có tồn tại không
    boolean existsByModelName(String modelName);
}
