-- Database for AHAD Electronics Service Management

CREATE DATABASE IF NOT EXISTS ahad_services;
USE ahad_services;

-- Users Table (Admin & Customers)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'customer') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Technicians Table
CREATE TABLE IF NOT EXISTS technicians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active'
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    service_id INT NOT NULL,
    technician_id INT,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    address TEXT NOT NULL,
    status ENUM('Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE SET NULL
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Insert Default Admin User (Password: admin123)
-- Note: In a real app, use password_hash() in PHP. Here we simulate a hashed password.
-- For this setup to work immediately, we will insert a known hash if possible for testing, 
-- or we can just rely on the registration page to create the first user. 
-- Let's insert some default services though.

INSERT INTO services (service_name, description, price, image_url) VALUES
('AC Installation', 'Professional Air Conditioner installation service', 1500.00, 'ac_install.jpg'),
('AC Repair & Service', 'Expert AC repair and maintenance', 800.00, 'ac_repair.jpg'),
('Washing Machine Repair', 'Front load and top load washing machine repair', 600.00, 'washing_machine.jpg'),
('Refrigerator Repair', 'Single and double door fridge repair services', 700.00, 'fridge_repair.jpg'),
('Computer/Laptop Service', 'Desktop and Laptop hardware/software support', 500.00, 'computer_repair.jpg'),
('Projector Service', 'Projector cleaning and lamp replacement', 1200.00, 'projector.jpg');

