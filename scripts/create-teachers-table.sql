-- Create teachers table
USE your_database_name;

CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NULL,
    subject VARCHAR(100) NOT NULL,
    experience VARCHAR(100) NULL,
    qualification VARCHAR(200) NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_subject (subject)
);

-- Insert sample teachers
INSERT INTO teachers (name, email, phone, subject, experience, qualification, status, created_at) VALUES 
('Jane Smith', 'jane.smith@example.com', '1234567890', 'Mathematics', '5 years', 'M.Sc Mathematics', 'active', NOW()),
('Robert Johnson', 'robert.johnson@example.com', '1234567891', 'Physics', '8 years', 'Ph.D Physics', 'active', NOW()),
('Emily Davis', 'emily.davis@example.com', '1234567892', 'Chemistry', '3 years', 'M.Sc Chemistry', 'active', NOW());
