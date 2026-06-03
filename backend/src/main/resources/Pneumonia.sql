/* PostgreSQL version of Pneumonia.sql – compatible with Spring Boot sql.init */

-- 1. admin_logs
CREATE TABLE admin_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT REFERENCES users(id),
    action VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 3. users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    address VARCHAR(255),
    full_name VARCHAR(255),
    locked_at TIMESTAMP,
    locked_reason VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20)
);

-- 4. model_metrics
CREATE TABLE model_metrics (
    model_id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL UNIQUE,
    accuracy DOUBLE PRECISION,
    precision_score DOUBLE PRECISION,
    recall_score DOUBLE PRECISION,
    f1_score DOUBLE PRECISION,
    auc_score DOUBLE PRECISION,
    expected_runtime_ms INTEGER,
    version VARCHAR(20) DEFAULT '1.0',
    trained_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. diagnosis_history
CREATE TABLE diagnosis_history (
    id BIGSERIAL PRIMARY KEY,
    confidence DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_path VARCHAR(255),
    label VARCHAR(255),
    user_id BIGINT NOT NULL REFERENCES users(id),
    inference_time_ms INTEGER NOT NULL DEFAULT 0,
    gradcam_path VARCHAR(255),
    model_id INTEGER REFERENCES model_metrics(model_id)
);

-- 6. expert_reviews
CREATE TABLE expert_reviews (
    id BIGSERIAL PRIMARY KEY,
    diagnosis_id BIGINT NOT NULL REFERENCES diagnosis_history(id),
    doctor_id BIGINT NOT NULL REFERENCES users(id),
    final_label VARCHAR(50) NOT NULL,
    doctor_comment TEXT,
    is_used_for_training BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed data: roles
INSERT INTO roles (id, name) VALUES
    (1, 'ROLE_USER'),
    (2, 'ROLE_DOCTOR'),
    (3, 'ROLE_ADMIN');

-- Seed data: users (sample doctors, admin, patient)
INSERT INTO users (id, username, email, password, role_id, created_at, role, enabled, address, full_name, phone, status, gender) VALUES
    (21, 'bacsi1', 'bacsi1@gmail.com', '$2a$10$LbB1rPdnbslTliV.2/I1POt7KriCuFAxQqpAwX3ZcqT0rD4ALN2MS', 2, CURRENT_TIMESTAMP, 'DOCTOR', TRUE, NULL, NULL, NULL, NULL, 'male'),
    (22, 'admin1', '123@abcd', '$2a$10$/.KnPZU0lSb8akAz2KGeKeLcfLYXZcTA9K/MeqNZ7276APaZCysjq', 3, CURRENT_TIMESTAMP, 'ADMIN', TRUE, NULL, NULL, NULL, NULL, NULL),
    (23, 'Phong', 'thanhphong1906200491@gmail.com', '$2a$10$NsuK8MwMUr.XLbcA0x7F6uvvNAmnynurWt22bXdsch4AHz1BHFYvK', 1, CURRENT_TIMESTAMP, 'PATIENT', TRUE, 'Huế', 'Nguyễn Thanh Phong', '0868170633', 'ACTIVE', 'male');

-- Seed data: model_metrics
INSERT INTO model_metrics (model_id, model_name, accuracy, precision_score, recall_score, f1_score, auc_score, expected_runtime_ms, version, trained_date)
VALUES
    (1, 'gated_fusion', 0.9423, 0.9381, 0.9718, 0.9547, 0.9325, 15, '1.0', CURRENT_TIMESTAMP),
    (2, 'vit', 0.9263, 0.9257, 0.959, 0.9421, 0.9154, 400, '1.0', CURRENT_TIMESTAMP),
    (3, 'densenet169', 0.8782, 0.8473, 0.9821, 0.9097, 0.8436, 2000, '1.0', CURRENT_TIMESTAMP);

-- Sample diagnosis_history entries (first few rows)
INSERT INTO diagnosis_history (id, confidence, created_at, image_path, label, user_id, inference_time_ms, gradcam_path, model_id) VALUES
    (1, 0.9906830172653309, TIMESTAMP '2026-05-22 10:22:22.5659275', '/uploads/1779420139814_person1_virus_6.jpeg', 'Pneumonia', 21, 2728, '/uploads/gradcams/1779420144455_gradcam.jpg', 1),
    (2, 0.9906830172653309, TIMESTAMP '2026-05-22 12:22:36.8684297', '/uploads/1779427347753_person1_virus_6.jpeg', 'Pneumonia', 23, 9031, '/uploads/gradcams/1779427365983_gradcam.jpg', 1);

-- Sample expert_reviews entries
INSERT INTO expert_reviews (id, diagnosis_id, doctor_id, final_label, doctor_comment, is_used_for_training, reviewed_at) VALUES
    (1, 1, 21, 'Pneumonia', 'nhiều đốm mờ', FALSE, TIMESTAMP '2026-05-22 12:39:35.7677488'),
    (2, 4, 21, 'Pneumonia', 'viêm phổi', FALSE, TIMESTAMP '2026-05-22 12:40:47.7154655');

-- Indexes for uniqueness (already enforced by constraints above)
