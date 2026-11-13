CREATE DATABASE IF NOT EXISTS classflow_db;
USE classflow_db;

-- 1. Academic Classes & Groups (e.g., Class 9 - Biology)
CREATE TABLE class_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    group_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_class_group UNIQUE (class_name, group_name)
);

-- 2. Users (Admins and Students)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student') NOT NULL,
    class_group_id INT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_class_group
        FOREIGN KEY (class_group_id) REFERENCES class_groups(id)
        ON DELETE RESTRICT
);

-- 3. Daily Schedules (Header / Container)
CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_group_id INT NOT NULL,
    schedule_date DATE NOT NULL,
    status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_schedule_per_status UNIQUE (class_group_id, schedule_date, status),
    CONSTRAINT fk_schedules_class_group
        FOREIGN KEY (class_group_id) REFERENCES class_groups(id)
        ON DELETE RESTRICT
);

-- 4. Individual Lecture Slots inside a Schedule
CREATE TABLE schedule_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    teacher_name VARCHAR(100) NULL,
    is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_slot_time CHECK (end_time > start_time),
    CONSTRAINT fk_slots_schedule
        FOREIGN KEY (schedule_id) REFERENCES schedules(id)
        ON DELETE CASCADE
);

-- 5. Center-Wide Holidays
CREATE TABLE holidays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    holiday_date DATE NOT NULL UNIQUE,
    reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 6. Schedule Revision 
CREATE TABLE IF NOT EXISTS schedule_revisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    revision_number INT NOT NULL,
    slots_snapshot TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);
-- Sample Data
-- 0. class_groups data 
INSERT INTO class_groups ( class_name, group_name)
VALUES("Class 9", "Biology");

-- 1. Admin Account (Admin kisi class/group se linked nahi hota, isliye class_group_id = NULL)
INSERT INTO users (username, first_name, last_name, password_hash, role, class_group_id)
VALUES ('admin', 'Tuition', 'Owner', 'temp_hash_123', 'admin', NULL);

-- 2. Student Account (Yeh Class 9 - Biology ka student hai, isliye class_group_id = 1)
INSERT INTO users (username, first_name, last_name, password_hash, role, class_group_id)
VALUES ('2026-09-01', 'Ali', 'Raza', 'temp_hash_456', 'student', 1);

select * from class_groups;
select * from schedules;
select * from schedule_slots;
select * from schedule_revisions;