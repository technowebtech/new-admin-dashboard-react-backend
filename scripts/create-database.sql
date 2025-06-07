-- Create database
CREATE DATABASE IF NOT EXISTS your_database_name;
USE your_database_name;

-- Create users table with proper timestamp handling
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    bio TEXT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_role (role)
);

-- Insert sample admin user (password: admin123)
INSERT INTO users (name, email, password, role, status, created_at) VALUES 
('Admin User', 'admin@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3Haa', 'admin', 'active', NOW());

-- Insert sample regular user (password: user123)
INSERT INTO users (name, email, password, role, status, created_at) VALUES 
('John Doe', 'john@example.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'active', NOW());

-- Create a helper function to get current timestamp in consistent format
DELIMITER //
CREATE FUNCTION IF NOT EXISTS get_current_timestamp() 
RETURNS TIMESTAMP
DETERMINISTIC
BEGIN
    RETURN NOW();
END //
DELIMITER ;

-- Example of using the function
-- SELECT get_current_timestamp();
