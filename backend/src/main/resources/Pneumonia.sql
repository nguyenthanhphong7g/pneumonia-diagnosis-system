/* SQL Server version of Pneumonia.sql – compatible with Spring Boot sql.init */

-- 1. admin_logs
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[admin_logs]') AND type = N'U')
BEGIN
CREATE TABLE dbo.admin_logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    admin_id BIGINT NULL REFERENCES dbo.users(id),
    action VARCHAR(255) NULL,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
END

-- 2. roles
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[roles]') AND type = N'U')
BEGIN
CREATE TABLE dbo.roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);
END

-- 3. users
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type = N'U')
BEGIN
CREATE TABLE dbo.users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES dbo.roles(id),
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(50) NOT NULL,
    enabled BIT NOT NULL DEFAULT 1,
    address VARCHAR(255) NULL,
    full_name VARCHAR(255) NULL,
    locked_at DATETIME2 NULL,
    locked_reason VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    status VARCHAR(20) NULL,
    date_of_birth DATE NULL,
    gender VARCHAR(20) NULL
);
END

-- 4. model_metrics
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[model_metrics]') AND type = N'U')
BEGIN
CREATE TABLE dbo.model_metrics (
    model_id INT IDENTITY(1,1) PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL UNIQUE,
    accuracy FLOAT NULL,
    precision_score FLOAT NULL,
    recall_score FLOAT NULL,
    f1_score FLOAT NULL,
    auc_score FLOAT NULL,
    expected_runtime_ms INT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    trained_date DATETIME2 NULL,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
END

-- 5. diagnosis_history
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[diagnosis_history]') AND type = N'U')
BEGIN
CREATE TABLE dbo.diagnosis_history (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    confidence FLOAT NULL,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    image_path VARCHAR(255) NULL,
    label VARCHAR(255) NULL,
    user_id BIGINT NOT NULL REFERENCES dbo.users(id),
    inference_time_ms INT NOT NULL DEFAULT 0,
    gradcam_path VARCHAR(255) NULL,
    model_id INT NULL REFERENCES dbo.model_metrics(model_id)
);
END

-- 6. expert_reviews
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[expert_reviews]') AND type = N'U')
BEGIN
CREATE TABLE dbo.expert_reviews (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    diagnosis_id BIGINT NOT NULL REFERENCES dbo.diagnosis_history(id),
    doctor_id BIGINT NOT NULL REFERENCES dbo.users(id),
    final_label VARCHAR(50) NOT NULL,
    doctor_comment NVARCHAR(MAX) NULL,
    is_used_for_training BIT NOT NULL DEFAULT 0,
    reviewed_at DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP
);
END

-- Seed data: roles
SET IDENTITY_INSERT dbo.roles ON;
INSERT INTO dbo.roles (id, name) VALUES
    (1, 'ROLE_USER'),
    (2, 'ROLE_DOCTOR'),
    (3, 'ROLE_ADMIN');
SET IDENTITY_INSERT dbo.roles OFF;

-- Seed data: users (sample doctors, admin, patient)
SET IDENTITY_INSERT dbo.users ON;
INSERT INTO dbo.users (id, username, email, password, role_id, created_at, role, enabled, address, full_name, phone, status, gender) VALUES
    (21, 'bacsi1', 'bacsi1@gmail.com', '$2a$10$LbB1rPdnbslTliV.2/I1POt7KriCuFAxQqpAwX3ZcqT0rD4ALN2MS', 2, CURRENT_TIMESTAMP, 'DOCTOR', 1, NULL, NULL, NULL, NULL, 'male'),
    (22, 'admin1', '123@abcd', '$2a$10$/.KnPZU0lSb8akAz2KGeKeLcfLYXZcTA9K/MeqNZ7276APaZCysjq', 3, CURRENT_TIMESTAMP, 'ADMIN', 1, NULL, NULL, NULL, NULL, NULL),
    (23, 'Phong', 'thanhphong1906200491@gmail.com', '$2a$10$NsuK8MwMUr.XLbcA0x7F6uvvNAmnynurWt22bXdsch4AHz1BHFYvK', 1, CURRENT_TIMESTAMP, 'PATIENT', 1, N'Huế', N'Nguyễn Thanh Phong', '0868170633', 'ACTIVE', 'male');
SET IDENTITY_INSERT dbo.users OFF;

-- Seed data: model_metrics
SET IDENTITY_INSERT dbo.model_metrics ON;
INSERT INTO dbo.model_metrics (model_id, model_name, accuracy, precision_score, recall_score, f1_score, auc_score, expected_runtime_ms, version, trained_date)
VALUES
    (1, 'gated_fusion', 0.9423, 0.9381, 0.9718, 0.9547, 0.9325, 15, '1.0', CURRENT_TIMESTAMP),
    (2, 'vit', 0.9263, 0.9257, 0.959, 0.9421, 0.9154, 400, '1.0', CURRENT_TIMESTAMP),
    (3, 'densenet169', 0.8782, 0.8473, 0.9821, 0.9097, 0.8436, 2000, '1.0', CURRENT_TIMESTAMP);
SET IDENTITY_INSERT dbo.model_metrics OFF;

-- Sample diagnosis_history entries (first few rows)
SET IDENTITY_INSERT dbo.diagnosis_history ON;
INSERT INTO dbo.diagnosis_history (id, confidence, created_at, image_path, label, user_id, inference_time_ms, gradcam_path, model_id) VALUES
    (1, 0.9906830172653309, '2026-05-22 10:22:22.5659275', '/uploads/1779420139814_person1_virus_6.jpeg', 'Pneumonia', 21, 2728, '/uploads/gradcams/1779420144455_gradcam.jpg', 1),
    (2, 0.9906830172653309, '2026-05-22 12:22:36.8684297', '/uploads/1779427347753_person1_virus_6.jpeg', 'Pneumonia', 23, 9031, '/uploads/gradcams/1779427365983_gradcam.jpg', 1);
SET IDENTITY_INSERT dbo.diagnosis_history OFF;

-- Sample expert_reviews entries
SET IDENTITY_INSERT dbo.expert_reviews ON;
INSERT INTO dbo.expert_reviews (id, diagnosis_id, doctor_id, final_label, doctor_comment, is_used_for_training, reviewed_at) VALUES
    (1, 1, 21, 'Pneumonia', N'nhiều đốm mờ', 0, '2026-05-22 12:39:35.7677488'),
    (2, 4, 21, 'Pneumonia', N'viêm phổi', 0, '2026-05-22 12:40:47.7154655');
SET IDENTITY_INSERT dbo.expert_reviews OFF;

-- Indexes for uniqueness (already enforced by constraints above)
