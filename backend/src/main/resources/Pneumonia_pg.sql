CREATE TABLE admin_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT REFERENCES users(id),
    action VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(50) DEFAULT 'USER',
    enabled BOOLEAN DEFAULT TRUE,
    address VARCHAR(255),
    full_name VARCHAR(255),
    locked_at TIMESTAMP,
    locked_reason VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20)
);

CREATE TABLE model_metrics (
    model_id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) UNIQUE NOT NULL,
    accuracy DOUBLE PRECISION,
    precision_score DOUBLE PRECISION,
    recall_score DOUBLE PRECISION,
    f1_score DOUBLE PRECISION,
    auc_score DOUBLE PRECISION,
    expected_runtime_ms INT,
    version VARCHAR(10),
    trained_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE diagnosis_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    confidence DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_path VARCHAR(255),
    label VARCHAR(255),
    inference_time_ms INT,
    gradcam_path VARCHAR(255),
    model_id INT REFERENCES model_metrics(model_id)
);

CREATE TABLE expert_reviews (
    id BIGSERIAL PRIMARY KEY,
    diagnosis_id BIGINT REFERENCES diagnosis_history(id),
    doctor_id BIGINT REFERENCES users(id),
    final_label VARCHAR(50) NOT NULL,
    doctor_comment TEXT,
    is_used_for_training BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data (roles, users, model_metrics)
INSERT INTO roles (id, name) VALUES
    (1, 'ROLE_USER'),
    (2, 'ROLE_DOCTOR'),
    (3, 'ROLE_ADMIN');

INSERT INTO users (id, username, email, password, role_id, created_at, role, enabled)
VALUES
    (21, 'bacsi1', 'bacsi1@gmail.com', '$2a$10$LbB1rPdnbslTliV.2/I1POt7KriCuFAxQqpAwX3ZcqT0rD4ALN2MS', 2, CURRENT_TIMESTAMP, 'DOCTOR', TRUE),
    (22, 'admin1', '123@abcd', '$2a$10$/.KnPZU0lSb8akAz2KGeKeLcfLYXZcTA9K/MeqNZ7276APaZCysjq', 3, CURRENT_TIMESTAMP, 'ADMIN', TRUE),
    (23, 'Phong', 'thanhphong1906200491@gmail.com', '$2a$10$NsuK8MwMUr.XLbcA0x7F6uvvNAmnynurWt22bXdsch4AHz1BHFYvK', 1, CURRENT_TIMESTAMP, 'PATIENT', TRUE);

INSERT INTO model_metrics (model_id, model_name, accuracy, precision_score, recall_score, f1_score, auc_score, expected_runtime_ms, version, trained_date)
VALUES
    (1, 'gated_fusion', 0.9423, 0.9381, 0.9718, 0.9547, 0.9325, 15, '1.0', CURRENT_TIMESTAMP),
    (2, 'vit', 0.9263, 0.9257, 0.959, 0.9421, 0.9154, 400, '1.0', CURRENT_TIMESTAMP),
    (3, 'densenet169', 0.8782, 0.8473, 0.9821, 0.9097, 0.8436, 2000, '1.0', CURRENT_TIMESTAMP);

-- Optional: add more INSERT statements for diagnosis_history and expert_reviews as needed.
