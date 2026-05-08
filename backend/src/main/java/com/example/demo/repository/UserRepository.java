package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // Tìm user theo username (dùng cho Login)
    Optional<User> findByUsername(String username);

    // Tìm user theo email (dùng cho Register kiểm tra trùng)
    Optional<User> findByEmail(String email);

    // Kiểm tra username đã tồn tại chưa
    boolean existsByUsername(String username);

    // Kiểm tra email đã tồn tại chưa
    boolean existsByEmail(String email);

    // (Tùy chọn) Tìm theo username để lấy đầy đủ thông tin user
    Optional<User> findByUsernameIgnoreCase(String username);
}