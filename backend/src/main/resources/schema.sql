CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status VARCHAR(20),
    phone VARCHAR(20),
    address VARCHAR(255),
    locked_reason VARCHAR(255),
    full_name VARCHAR(255),
    gender VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    birth_date DATE,
    gender VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS diagnoses (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    image_path VARCHAR(255),
    gradcam_path VARCHAR(255),
    label VARCHAR(50),
    confidence NUMERIC(5,2),
    doctor_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);