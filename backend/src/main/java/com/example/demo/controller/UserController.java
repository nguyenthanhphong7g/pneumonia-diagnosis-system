package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // API 0: Health check
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "OK", "message", "UserController is running"));
    }

    // API 1: Lấy danh sách tất cả người dùng
    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // API 2: Lấy người dùng theo ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            Optional<User> user = userRepository.findById(id);
            if (user.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Không tìm thấy người dùng"));
            }
            return ResponseEntity.ok(user.get());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // API 3: Tạo người dùng mới
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> request) {
        try {
            String username = (String) request.get("username");
            String email = (String) request.get("email");
            String password = (String) request.get("password");
            String role = (String) request.getOrDefault("role", "PATIENT");

            // Validate
            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username không được để trống"));
            }
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password không được để trống"));
            }

            // Check username exists
            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username đã tồn tại"));
            }

            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(role);

            User savedUser = userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                    "message", "Tạo người dùng thành công",
                    "userId", savedUser.getId()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // API 4: Cập nhật người dùng
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Không tìm thấy người dùng"));
            }

            User user = userOpt.get();

            if (request.containsKey("email")) {
                user.setEmail((String) request.get("email"));
            }
            if (request.containsKey("role")) {
                user.setRole((String) request.get("role"));
            }
            if (request.containsKey("password") && !request.get("password").equals("")) {
                user.setPassword(passwordEncoder.encode((String) request.get("password")));
            }

            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Cập nhật người dùng thành công"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // API 5: Xóa người dùng
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Không tìm thấy người dùng"));
            }

            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Xóa người dùng thành công"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // API 6: Thống kê người dùng theo role
    @GetMapping("/stats/by-role")
    public ResponseEntity<?> getUserStatsByRole() {
        try {
            List<User> allUsers = userRepository.findAll();
            Map<String, Long> stats = Map.of(
                    "total", (long) allUsers.size(),
                    "admin", allUsers.stream().filter(u -> "ADMIN".equals(u.getRole())).count(),
                    "doctor", allUsers.stream().filter(u -> "DOCTOR".equals(u.getRole())).count(),
                    "patient", allUsers.stream().filter(u -> "PATIENT".equals(u.getRole())).count());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // API 7: Lock tài khoản (Admin only)
    @PutMapping("/{id}/lock")
    public ResponseEntity<?> lockUser(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Không tìm thấy người dùng"));
            }
            User user = userOpt.get();
            user.setStatus("LOCKED");
            user.setLockedAt(java.time.LocalDateTime.now());
            user.setLockedReason(body.getOrDefault("reason", "Locked by admin"));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Khóa tài khoản thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // API 8: Unlock tài khoản (Admin only)
    @PutMapping("/{id}/unlock")
    public ResponseEntity<?> unlockUser(@PathVariable Long id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Không tìm thấy người dùng"));
            }
            User user = userOpt.get();
            user.setStatus("ACTIVE");
            user.setLockedAt(null);
            user.setLockedReason(null);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Mở khóa tài khoản thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // API 9: Xem profile cá nhân
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@RequestHeader("Authorization") String token) {
        try {
            System.out.println("=== /me endpoint DEBUG ===");
            System.out.println("Token nhận được: "
                    + (token != null ? token.substring(0, Math.min(token.length(), 50)) + "..." : "NULL"));

            if (token == null || token.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "Token không được cung cấp"));
            }

            String jwt = token.replace("Bearer ", "").trim();
            System.out.println("JWT sau trim: " + jwt.substring(0, Math.min(jwt.length(), 50)) + "...");

            Long userId = null;
            try {
                userId = jwtUtil.extractUserId(jwt);
                System.out.println("UserId extracted: " + userId);
            } catch (Exception e) {
                System.out.println("ERROR extracting userId: " + e.toString());
                e.printStackTrace();
                return ResponseEntity.status(401).body(Map.of("error", "Token không hợp lệ: " + e.toString()));
            }

            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Không thể lấy userId từ token"));
            }

            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Không tìm thấy người dùng"));
            }

            User user = userOpt.get();
            // Remove password from response - use HashMap to allow null values
            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("username", user.getUsername());
            profile.put("email", user.getEmail());
            profile.put("fullName", user.getFullName());
            profile.put("phone", user.getPhone());
            profile.put("address", user.getAddress());
            profile.put("role", user.getRole());
            profile.put("status", user.getStatus());
            profile.put("createdAt", user.getCreatedAt());

            System.out.println("Profile loaded successfully for user: " + user.getUsername());
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("ERROR in /me endpoint (outer): " + e.toString());
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: " + e.toString()));
        }
    }

    // API 10: Cập nhật profile cá nhân
    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> body) {
        try {
            String jwt = token.replace("Bearer ", "").trim();
            Long userId = jwtUtil.extractUserId(jwt);

            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Không tìm thấy người dùng"));
            }

            User user = userOpt.get();
            if (body.containsKey("fullName"))
                user.setFullName(body.get("fullName"));
            if (body.containsKey("phone"))
                user.setPhone(body.get("phone"));
            if (body.containsKey("address"))
                user.setAddress(body.get("address"));

            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Cập nhật profile thành công"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
