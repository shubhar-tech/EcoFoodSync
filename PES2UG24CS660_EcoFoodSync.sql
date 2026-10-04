-- ============================================================
-- ECOFOODSYNC
-- MySQL 8.0 Complete SQL Script
-- Team: G14
-- SRN1: PES2UG24CS660
-- SRN2: PES2UG24CS676
-- ============================================================
--
-- Execution order:
-- DDL -> ALTER/CONSTRAINTS -> INDEXES -> VIEW -> DML ->
-- queries -> stored procedures -> function -> triggers ->
-- transaction -> cursor -> CTE/advanced queries -> verification.
--
-- This is a clean reproducible script. UUID values are generated
-- by MySQL, so IDs will differ from screenshots.
-- ============================================================

DROP DATABASE IF EXISTS ecofoodsync_db;
CREATE DATABASE ecofoodsync_db;
USE ecofoodsync_db;

-- ============================================================
-- 1. DDL - TABLE CREATION
-- ============================================================

-- 1.1 FOOD_DONOR
CREATE TABLE food_donor (
    donor_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    donor_type ENUM('RESTAURANT','SUPERMARKET','INDIVIDUAL','CATERER','OTHER') NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    donor_rating DECIMAL(3,2) DEFAULT 5.00,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_food_donor_email UNIQUE (email),
    CONSTRAINT chk_donor_rating
        CHECK (donor_rating >= 0.00 AND donor_rating <= 5.00)
) ENGINE=InnoDB;

-- 1.2 FOOD_DONATION
CREATE TABLE food_donation (
    donation_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    donor_id CHAR(36) NOT NULL,
    food_name VARCHAR(255) NOT NULL,
    food_type VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    preparation_time DATETIME NOT NULL,
    expiry_time DATETIME NOT NULL,
    food_condition ENUM('FRESH','PACKAGED','PERISHABLE_FAST','COOKED') NOT NULL,
    location TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_donation_donor
        FOREIGN KEY (donor_id) REFERENCES food_donor(donor_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_expiry_after_prep CHECK (expiry_time > preparation_time)
) ENGINE=InnoDB;

-- 1.3 CHARITY_OR_NGO
-- Current verified project schema uses location, district
-- and food_capacity.
CREATE TABLE charity_or_ngo (
    charity_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    district VARCHAR(150) NOT NULL,
    food_capacity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_charity_email UNIQUE (email),
    CONSTRAINT chk_food_capacity_positive CHECK (food_capacity > 0)
) ENGINE=InnoDB;

-- 1.4 ALLOCATION
CREATE TABLE allocation (
    allocation_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    donation_id CHAR(36) NOT NULL,
    charity_id CHAR(36) NOT NULL,
    allocated_quantity DECIMAL(10,2) NOT NULL,
    allocation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING','APPROVED','REJECTED','COMPLETED') DEFAULT 'PENDING',
    CONSTRAINT fk_allocation_donation
        FOREIGN KEY (donation_id) REFERENCES food_donation(donation_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_allocation_charity
        FOREIGN KEY (charity_id) REFERENCES charity_or_ngo(charity_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_allocated_qty_positive CHECK (allocated_quantity > 0)
) ENGINE=InnoDB;

-- 1.5 VOLUNTEER
CREATE TABLE volunteer (
    volunteer_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    availability_status BOOLEAN DEFAULT TRUE,
    current_location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_volunteer_email UNIQUE (email),
    CONSTRAINT uk_volunteer_phone UNIQUE (phone)
) ENGINE=InnoDB;

-- 1.6 PICKUP_DELIVERY
CREATE TABLE pickup_delivery (
    delivery_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    donation_id CHAR(36) NOT NULL,
    volunteer_id CHAR(36),
    charity_id CHAR(36) NOT NULL,
    pickup_time DATETIME,
    delivery_time DATETIME,
    vehicle_type VARCHAR(100),
    status ENUM('ASSIGNED','PICKED_UP','IN_TRANSIT','DELIVERED','CANCELLED')
        DEFAULT 'ASSIGNED',
    delivery_notes TEXT,
    CONSTRAINT fk_delivery_donation
        FOREIGN KEY (donation_id) REFERENCES food_donation(donation_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_delivery_volunteer
        FOREIGN KEY (volunteer_id) REFERENCES volunteer(volunteer_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_delivery_charity
        FOREIGN KEY (charity_id) REFERENCES charity_or_ngo(charity_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- 1.7 FOOD_REQUEST
CREATE TABLE food_request (
    request_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    charity_id CHAR(36) NOT NULL,
    required_food_type VARCHAR(100) NOT NULL,
    required_quantity DECIMAL(10,2) NOT NULL,
    urgency_level ENUM('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'MEDIUM',
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'OPEN',
    CONSTRAINT fk_request_charity
        FOREIGN KEY (charity_id) REFERENCES charity_or_ngo(charity_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_required_qty_positive CHECK (required_quantity > 0)
) ENGINE=InnoDB;

-- ============================================================
-- 2. ALTER / CONSTRAINT DEMONSTRATIONS
-- ============================================================

-- The final schema already uses the corrected definitions.
-- This MODIFY is retained as the verified ALTER operation.
ALTER TABLE volunteer
    MODIFY COLUMN phone VARCHAR(30) NOT NULL;

-- ============================================================
-- 3. INDEXING
-- ============================================================

CREATE INDEX idx_food_donation_donor
    ON food_donation(donor_id);

CREATE INDEX idx_allocation_donation
    ON allocation(donation_id);

CREATE INDEX idx_allocation_charity
    ON allocation(charity_id);

CREATE INDEX idx_pickup_delivery_volunteer
    ON pickup_delivery(volunteer_id);

CREATE INDEX idx_food_request_charity
    ON food_request(charity_id);

CREATE INDEX idx_donation_status_expiry
    ON food_donation(status, expiry_time, food_condition);

CREATE FULLTEXT INDEX idx_food_name_fulltext
    ON food_donation(food_name);

CREATE INDEX idx_pickup_active_deliveries
    ON pickup_delivery(volunteer_id, status);

-- ============================================================
-- 4. DML - INSERT DATA
-- ============================================================

-- 4.1 FOOD_DONOR
INSERT INTO food_donor
(name, donor_type, phone, email, address)
VALUES
('Green Leaf Restaurant', 'RESTAURANT', '9876543210',
 'greenleaf@gmail.com', 'Bangalore'),
('FreshMart Supermarket', 'SUPERMARKET', '9876543211',
 'freshmart@gmail.com', 'Mysore'),
('Annapurna Caterers', 'CATERER', '9876543212',
 'annapurna@gmail.com', 'Bangalore'),
('Daily Meals Restaurant', 'RESTAURANT', '9876543213',
 'dailymeals@gmail.com', 'Chennai');

-- 4.2 CHARITY_OR_NGO
INSERT INTO charity_or_ngo
(name, contact_person, phone, email, location, district, food_capacity)
VALUES
('Helping Hands NGO', 'Anita Sharma', '9000000001',
 'helpinghands@gmail.com', 'Bangalore', 'Bangalore Urban', 500),
('Food For All Foundation', 'Ravi Kumar', '9000000002',
 'foodforall@gmail.com', 'Mysore', 'Mysore', 300),
('Hope Community Centre', 'Priya Rao', '9000000003',
 'hopecentre@gmail.com', 'Chennai', 'Chennai', 400);

-- 4.3 VOLUNTEER
INSERT INTO volunteer
(name, phone, email, availability_status, current_location)
VALUES
('Arjun Singh', '9111111111', 'arjun@gmail.com', TRUE, 'Bangalore'),
('Sneha Rao', '9222222222', 'sneha@gmail.com', TRUE, 'Mysore'),
('Kiran Kumar', '9333333333', 'kirank@gmail.com', TRUE, 'Chennai');

-- 4.4 FOOD_DONATION
INSERT INTO food_donation
(donor_id, food_name, food_type, quantity,
 preparation_time, expiry_time, food_condition, location, status)
VALUES
(
    (SELECT donor_id FROM food_donor
     WHERE email = 'greenleaf@gmail.com' LIMIT 1),
    'Vegetable Biryani',
    'Cooked',
    50.00,
    '2026-09-28 09:00:00',
    '2026-09-28 18:00:00',
    'COOKED',
    'Bangalore',
    'AVAILABLE'
),
(
    (SELECT donor_id FROM food_donor
     WHERE email = 'freshmart@gmail.com' LIMIT 1),
    'Fresh Bread',
    'Bakery',
    30.00,
    '2026-09-28 08:00:00',
    '2026-09-29 12:00:00',
    'FRESH',
    'Mysore',
    'AVAILABLE'
),
(
    (SELECT donor_id FROM food_donor
     WHERE email = 'annapurna@gmail.com' LIMIT 1),
    'Rice and Curry',
    'Cooked',
    75.00,
    '2026-09-28 10:00:00',
    '2026-09-28 20:00:00',
    'COOKED',
    'Bangalore',
    'AVAILABLE'
);

-- 4.5 ALLOCATION
INSERT INTO allocation
(donation_id, charity_id, allocated_quantity, status)
VALUES
(
    (SELECT donation_id FROM food_donation
     WHERE food_name = 'Vegetable Biryani' LIMIT 1),
    (SELECT charity_id FROM charity_or_ngo
     WHERE email = 'helpinghands@gmail.com' LIMIT 1),
    30.00,
    'APPROVED'
),
(
    (SELECT donation_id FROM food_donation
     WHERE food_name = 'Fresh Bread' LIMIT 1),
    (SELECT charity_id FROM charity_or_ngo
     WHERE email = 'foodforall@gmail.com' LIMIT 1),
    20.00,
    'PENDING'
);

-- 4.6 PICKUP_DELIVERY
INSERT INTO pickup_delivery
(donation_id, volunteer_id, charity_id,
 pickup_time, delivery_time, vehicle_type, status, delivery_notes)
VALUES
(
    (SELECT donation_id FROM food_donation
     WHERE food_name = 'Vegetable Biryani' LIMIT 1),
    (SELECT volunteer_id FROM volunteer
     WHERE email = 'arjun@gmail.com' LIMIT 1),
    (SELECT charity_id FROM charity_or_ngo
     WHERE email = 'helpinghands@gmail.com' LIMIT 1),
    '2026-09-28 12:00:00',
    '2026-09-28 13:00:00',
    'Van',
    'DELIVERED',
    'Food delivered successfully'
),
(
    (SELECT donation_id FROM food_donation
     WHERE food_name = 'Fresh Bread' LIMIT 1),
    (SELECT volunteer_id FROM volunteer
     WHERE email = 'sneha@gmail.com' LIMIT 1),
    (SELECT charity_id FROM charity_or_ngo
     WHERE email = 'foodforall@gmail.com' LIMIT 1),
    '2026-09-28 11:00:00',
    NULL,
    'Mini Truck',
    'IN_TRANSIT',
    'Delivery in progress'
);

-- 4.7 FOOD_REQUEST
INSERT INTO food_request
(charity_id, required_food_type, required_quantity,
 urgency_level, status)
VALUES
(
    (SELECT charity_id FROM charity_or_ngo
     WHERE email = 'helpinghands@gmail.com' LIMIT 1),
    'Cooked Food',
    100.00,
    'HIGH',
    'OPEN'
),
(
    (SELECT charity_id FROM charity_or_ngo
     WHERE email = 'foodforall@gmail.com' LIMIT 1),
    'Bakery',
    50.00,
    'MEDIUM',
    'OPEN'
),
(
    (SELECT charity_id FROM charity_or_ngo
     WHERE email = 'hopecentre@gmail.com' LIMIT 1),
    'Cooked Food',
    80.00,
    'CRITICAL',
    'OPEN'
);

-- ============================================================
-- 5. DML - UPDATE OPERATIONS
-- ============================================================

-- 5.1 Update Food Donation Status
UPDATE food_donation
SET status = 'CLAIMED'
WHERE food_name = 'Vegetable Biryani';

SELECT food_name, status
FROM food_donation
WHERE food_name = 'Vegetable Biryani';

-- Restore the original state for the rest of the script.
UPDATE food_donation
SET status = 'AVAILABLE'
WHERE food_name = 'Vegetable Biryani';

-- 5.2 Update Volunteer Availability
UPDATE volunteer
SET availability_status = FALSE,
    current_location = 'Bangalore'
WHERE email = 'arjun@gmail.com';

SELECT name, availability_status, current_location
FROM volunteer
WHERE email = 'arjun@gmail.com';

UPDATE volunteer
SET availability_status = TRUE
WHERE email = 'arjun@gmail.com';

-- 5.3 Update Charity Capacity
UPDATE charity_or_ngo
SET food_capacity = food_capacity + 100
WHERE email = 'helpinghands@gmail.com';

SELECT name, food_capacity
FROM charity_or_ngo
WHERE email = 'helpinghands@gmail.com';

UPDATE charity_or_ngo
SET food_capacity = food_capacity - 100
WHERE email = 'helpinghands@gmail.com';

-- 5.4 Update Allocation Status
UPDATE allocation
SET status = 'APPROVED'
WHERE donation_id = (
    SELECT donation_id
    FROM food_donation
    WHERE food_name = 'Fresh Bread'
    LIMIT 1
);

SELECT allocation_id, allocated_quantity, status
FROM allocation
WHERE donation_id = (
    SELECT donation_id
    FROM food_donation
    WHERE food_name = 'Fresh Bread'
    LIMIT 1
);

UPDATE allocation
SET status = 'PENDING'
WHERE donation_id = (
    SELECT donation_id
    FROM food_donation
    WHERE food_name = 'Fresh Bread'
    LIMIT 1
);

-- ============================================================
-- 6. DML - DELETE OPERATIONS
-- Demonstrated without permanently changing the project's
-- final sample data.
-- ============================================================

START TRANSACTION;

INSERT INTO food_request
(charity_id, required_food_type, required_quantity, urgency_level, status)
VALUES
(
    (SELECT charity_id FROM charity_or_ngo
     WHERE email = 'foodforall@gmail.com' LIMIT 1),
    'TEMPORARY TEST FOOD',
    1.00,
    'LOW',
    'OPEN'
);

DELETE FROM food_request
WHERE required_food_type = 'TEMPORARY TEST FOOD';

ROLLBACK;

START TRANSACTION;

INSERT INTO volunteer
(name, phone, email, availability_status, current_location)
VALUES
('Temporary Volunteer', '9999999999',
 'temporary.volunteer@ecofoodsync.test', TRUE, 'Bangalore');

DELETE FROM volunteer
WHERE email = 'temporary.volunteer@ecofoodsync.test';

ROLLBACK;

-- ============================================================
-- 7. SELECT / JOIN / AGGREGATE / GROUP BY / HAVING /
--    ORDER BY / SUBQUERIES / COMPLEX QUERIES
-- ============================================================

-- 7.1 Display All Food Donations
SELECT * FROM food_donation;

-- 7.2 Display Available Food
SELECT food_name, food_type, quantity, location, expiry_time
FROM food_donation
WHERE status = 'AVAILABLE';

-- 7.3 Display High-Quantity Donations
SELECT food_name, quantity, location
FROM food_donation
WHERE quantity > 40;

-- 7.4 Display Donations by Earliest Expiry
SELECT food_name, quantity, expiry_time
FROM food_donation
ORDER BY expiry_time ASC;

-- 7.5 Display High-Urgency Food Requests
SELECT required_food_type, required_quantity, urgency_level, status
FROM food_request
WHERE urgency_level IN ('HIGH', 'CRITICAL');

-- 7.6 Donor + Food Donation
SELECT
    d.name AS donor_name,
    fd.food_name,
    fd.quantity,
    fd.location
FROM food_donor d
JOIN food_donation fd
    ON d.donor_id = fd.donor_id;

-- 7.7 Donation + Charity
SELECT
    fd.food_name,
    c.name AS charity_name,
    a.allocated_quantity,
    a.status
FROM allocation a
JOIN food_donation fd
    ON a.donation_id = fd.donation_id
JOIN charity_or_ngo c
    ON a.charity_id = c.charity_id;

-- 7.8 Complete Delivery Information
SELECT
    fd.food_name,
    d.name AS donor_name,
    v.name AS volunteer_name,
    c.name AS charity_name,
    pd.status
FROM pickup_delivery pd
JOIN food_donation fd
    ON pd.donation_id = fd.donation_id
JOIN food_donor d
    ON fd.donor_id = d.donor_id
LEFT JOIN volunteer v
    ON pd.volunteer_id = v.volunteer_id
JOIN charity_or_ngo c
    ON pd.charity_id = c.charity_id;

-- 7.9 Aggregate Functions
SELECT COUNT(*) AS total_donations
FROM food_donation;

SELECT SUM(quantity) AS total_food_quantity
FROM food_donation;

SELECT AVG(quantity) AS average_food_quantity
FROM food_donation;

SELECT MAX(quantity) AS maximum_donation
FROM food_donation;

SELECT MIN(quantity) AS minimum_donation
FROM food_donation;

SELECT
    COUNT(*) AS total_donations,
    SUM(quantity) AS total_quantity,
    AVG(quantity) AS average_quantity,
    MAX(quantity) AS maximum_quantity,
    MIN(quantity) AS minimum_quantity
FROM food_donation;

-- 7.10 GROUP BY
SELECT
    d.name AS donor_name,
    SUM(fd.quantity) AS total_quantity
FROM food_donor d
JOIN food_donation fd
    ON d.donor_id = fd.donor_id
GROUP BY d.donor_id, d.name;

SELECT
    c.name AS charity_name,
    SUM(a.allocated_quantity) AS total_received
FROM charity_or_ngo c
JOIN allocation a
    ON c.charity_id = a.charity_id
GROUP BY c.charity_id, c.name;

-- 7.11 HAVING
SELECT
    d.name AS donor_name,
    SUM(fd.quantity) AS total_quantity
FROM food_donor d
JOIN food_donation fd
    ON d.donor_id = fd.donor_id
GROUP BY d.donor_id, d.name
HAVING SUM(fd.quantity) > 40;

SELECT
    c.name AS charity_name,
    SUM(a.allocated_quantity) AS total_received
FROM charity_or_ngo c
JOIN allocation a
    ON c.charity_id = a.charity_id
GROUP BY c.charity_id, c.name
HAVING SUM(a.allocated_quantity) > 20;

-- 7.12 ORDER BY
SELECT food_name, quantity, location
FROM food_donation
ORDER BY quantity DESC;

SELECT food_name, quantity, expiry_time
FROM food_donation
ORDER BY expiry_time ASC;

-- 7.13 Subqueries
SELECT
    food_name,
    quantity
FROM food_donation
WHERE quantity > (
    SELECT AVG(quantity)
    FROM food_donation
);

SELECT
    food_name,
    quantity
FROM food_donation
WHERE quantity = (
    SELECT MAX(quantity)
    FROM food_donation
);

SELECT
    name,
    food_capacity
FROM charity_or_ngo
WHERE food_capacity > (
    SELECT AVG(food_capacity)
    FROM charity_or_ngo
);

-- 7.14 Complex Queries
SELECT
    d.name AS donor_name,
    SUM(fd.quantity) AS total_quantity
FROM food_donor d
JOIN food_donation fd
    ON d.donor_id = fd.donor_id
GROUP BY d.donor_id, d.name
HAVING SUM(fd.quantity) > 40
ORDER BY total_quantity DESC;

SELECT
    fd.food_name,
    d.name AS donor_name,
    c.name AS charity_name,
    a.allocated_quantity,
    a.status
FROM allocation a
JOIN food_donation fd
    ON a.donation_id = fd.donation_id
JOIN food_donor d
    ON fd.donor_id = d.donor_id
JOIN charity_or_ngo c
    ON a.charity_id = c.charity_id
ORDER BY a.allocated_quantity DESC;

-- ============================================================
-- 8. VIEW
-- ============================================================

-- Corrected/current project version: charity_or_ngo uses
-- c.location, not c.address.
CREATE OR REPLACE VIEW vw_active_deliveries AS
SELECT
    pd.delivery_id,
    fd.food_name,
    fd.quantity,
    c.name AS recipient_charity,
    c.location AS delivery_address,
    v.name AS volunteer_name,
    v.phone AS volunteer_phone,
    pd.status AS delivery_status,
    pd.pickup_time
FROM pickup_delivery pd
JOIN food_donation fd
    ON pd.donation_id = fd.donation_id
JOIN charity_or_ngo c
    ON pd.charity_id = c.charity_id
JOIN volunteer v
    ON pd.volunteer_id = v.volunteer_id;

SELECT * FROM vw_active_deliveries;

-- ============================================================
-- 9. INDEXING / QUERY OPTIMIZATION VERIFICATION
-- ============================================================

SHOW INDEX FROM food_donation;

EXPLAIN
SELECT *
FROM food_donation
WHERE donor_id = (
    SELECT donor_id
    FROM food_donor
    WHERE email = 'greenleaf@gmail.com'
);

EXPLAIN
SELECT *
FROM food_donation
WHERE status = 'AVAILABLE'
ORDER BY expiry_time;

EXPLAIN
SELECT *
FROM food_donation
WHERE MATCH(food_name)
AGAINST('Bread');

-- ============================================================
-- 10. STORED PROCEDURES
-- ============================================================

DROP PROCEDURE IF EXISTS GetAvailableFoodByLocation;
DROP PROCEDURE IF EXISTS GetDonationAllocationSummary;

DELIMITER $$

CREATE PROCEDURE GetAvailableFoodByLocation(
    IN p_location VARCHAR(100)
)
BEGIN
    SELECT
        donation_id,
        food_name,
        food_type,
        quantity,
        food_condition,
        expiry_time,
        location,
        status
    FROM food_donation
    WHERE location = p_location
      AND status = 'AVAILABLE'
      AND expiry_time > NOW()
    ORDER BY expiry_time;
END $$

CREATE PROCEDURE GetDonationAllocationSummary()
BEGIN
    SELECT
        fd.donation_id,
        fd.food_name,
        fd.quantity AS donated_quantity,
        COALESCE(SUM(a.allocated_quantity), 0) AS allocated_quantity,
        fd.quantity - COALESCE(SUM(a.allocated_quantity), 0) AS remaining_quantity
    FROM food_donation fd
    LEFT JOIN allocation a
        ON fd.donation_id = a.donation_id
    GROUP BY
        fd.donation_id,
        fd.food_name,
        fd.quantity
    ORDER BY fd.food_name;
END $$

DELIMITER ;

CALL GetAvailableFoodByLocation('Bangalore');
CALL GetDonationAllocationSummary();

-- ============================================================
-- 11. STORED FUNCTION
-- ============================================================

DROP FUNCTION IF EXISTS GetRemainingDonationQuantity;

DELIMITER $$

CREATE FUNCTION GetRemainingDonationQuantity(
    p_donation_id CHAR(36)
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE donated_qty DECIMAL(10,2);
    DECLARE allocated_qty DECIMAL(10,2);

    SELECT quantity
    INTO donated_qty
    FROM food_donation
    WHERE donation_id = p_donation_id;

    SELECT COALESCE(SUM(allocated_quantity), 0)
    INTO allocated_qty
    FROM allocation
    WHERE donation_id = p_donation_id;

    RETURN donated_qty - allocated_qty;
END $$

DELIMITER ;

SELECT
    food_name,
    quantity AS donated_quantity,
    GetRemainingDonationQuantity(donation_id) AS remaining_quantity
FROM food_donation;

-- ============================================================
-- 12. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS before_allocation_insert;
DROP TRIGGER IF EXISTS before_food_donation_insert;

DELIMITER $$

CREATE TRIGGER before_allocation_insert
BEFORE INSERT ON allocation
FOR EACH ROW
BEGIN
    DECLARE available_qty DECIMAL(10,2);

    SELECT
        quantity - COALESCE(
            (
                SELECT SUM(allocated_quantity)
                FROM allocation
                WHERE donation_id = NEW.donation_id
            ),
            0
        )
    INTO available_qty
    FROM food_donation
    WHERE donation_id = NEW.donation_id;

    IF NEW.allocated_quantity > available_qty THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Allocation exceeds available donation quantity';
    END IF;
END $$

CREATE TRIGGER before_food_donation_insert
BEFORE INSERT ON food_donation
FOR EACH ROW
BEGIN
    IF NEW.expiry_time <= NEW.preparation_time THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Expiry time must be after preparation time';
    END IF;
END $$

DELIMITER ;

-- Valid allocation trigger test:
-- Fresh Bread has 10 kg remaining after the original 20 kg.
INSERT INTO allocation
(donation_id, charity_id, allocated_quantity, status)
VALUES
(
    (SELECT donation_id FROM food_donation
     WHERE food_name = 'Fresh Bread' LIMIT 1),
    (SELECT charity_id FROM charity_or_ngo
     WHERE name = 'Food For All Foundation' LIMIT 1),
    10.00,
    'PENDING'
);

-- Invalid allocation trigger test:
-- Vegetable Biryani has 20 kg remaining; 25 kg must fail.
-- Uncomment ONLY when demonstrating the error:
-- INSERT INTO allocation
-- (donation_id, charity_id, allocated_quantity, status)
-- VALUES
-- (
--     (SELECT donation_id FROM food_donation
--      WHERE food_name = 'Vegetable Biryani' LIMIT 1),
--     (SELECT charity_id FROM charity_or_ngo
--      WHERE name = 'Helping Hands NGO' LIMIT 1),
--     25.00,
--     'PENDING'
-- );

-- Invalid expiry trigger test:
-- Uncomment ONLY when demonstrating the error:
-- INSERT INTO food_donation
-- (donor_id, food_name, food_type, quantity,
--  preparation_time, expiry_time, food_condition, location, status)
-- VALUES
-- (
--     (SELECT donor_id FROM food_donor
--      WHERE email = 'greenleaf@gmail.com' LIMIT 1),
--     'Test Food',
--     'Cooked',
--     10.00,
--     '2026-09-30 15:00:00',
--     '2026-09-30 14:00:00',
--     'COOKED',
--     'Bangalore',
--     'AVAILABLE'
-- );

-- ============================================================
-- 13. TRANSACTION
-- ============================================================

START TRANSACTION;

SAVEPOINT before_allocation_test;

INSERT INTO allocation
(donation_id, charity_id, allocated_quantity, status)
VALUES
(
    (SELECT donation_id FROM food_donation
     WHERE food_name = 'Rice and Curry' LIMIT 1),
    (SELECT charity_id FROM charity_or_ngo
     WHERE name = 'Food For All Foundation' LIMIT 1),
    5.00,
    'PENDING'
);

SELECT
    fd.food_name,
    a.allocated_quantity,
    a.status
FROM allocation a
JOIN food_donation fd
    ON a.donation_id = fd.donation_id
WHERE fd.food_name = 'Rice and Curry';

ROLLBACK TO SAVEPOINT before_allocation_test;

SELECT
    fd.food_name,
    a.allocated_quantity,
    a.status
FROM allocation a
JOIN food_donation fd
    ON a.donation_id = fd.donation_id
WHERE fd.food_name = 'Rice and Curry';

INSERT INTO allocation
(donation_id, charity_id, allocated_quantity, status)
VALUES
(
    (SELECT donation_id FROM food_donation
     WHERE food_name = 'Rice and Curry' LIMIT 1),
    (SELECT charity_id FROM charity_or_ngo
     WHERE name = 'Food For All Foundation' LIMIT 1),
    5.00,
    'PENDING'
);

COMMIT;

SELECT
    fd.food_name,
    a.allocated_quantity,
    a.status
FROM allocation a
JOIN food_donation fd
    ON a.donation_id = fd.donation_id
WHERE fd.food_name = 'Rice and Curry';

-- ============================================================
-- 14. CURSOR
-- ============================================================

DROP PROCEDURE IF EXISTS ProcessFoodDonations;

DELIMITER $$

CREATE PROCEDURE ProcessFoodDonations()
BEGIN
    DECLARE done INT DEFAULT 0;

    DECLARE v_food_name VARCHAR(255);
    DECLARE v_quantity DECIMAL(10,2);
    DECLARE v_status VARCHAR(50);

    DECLARE donation_cursor CURSOR FOR
        SELECT food_name, quantity, status
        FROM food_donation;

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET done = 1;

    OPEN donation_cursor;

    read_loop: LOOP

        FETCH donation_cursor
        INTO v_food_name, v_quantity, v_status;

        IF done = 1 THEN
            LEAVE read_loop;
        END IF;

        SELECT
            v_food_name AS food_name,
            v_quantity AS quantity,
            v_status AS status;

    END LOOP;

    CLOSE donation_cursor;
END $$

DELIMITER ;

CALL ProcessFoodDonations();

-- ============================================================
-- 15. CTE / WINDOW FUNCTION / ADVANCED QUERIES
-- ============================================================

WITH donation_summary AS (
    SELECT
        fd.donation_id,
        fd.food_name,
        fd.quantity,
        COALESCE(SUM(a.allocated_quantity), 0) AS allocated_quantity
    FROM food_donation fd
    LEFT JOIN allocation a
        ON fd.donation_id = a.donation_id
    GROUP BY
        fd.donation_id,
        fd.food_name,
        fd.quantity
)
SELECT
    food_name,
    quantity AS donated_quantity,
    allocated_quantity,
    quantity - allocated_quantity AS remaining_quantity
FROM donation_summary
ORDER BY remaining_quantity DESC;

SELECT
    food_name,
    quantity,
    RANK() OVER (ORDER BY quantity DESC) AS donation_rank
FROM food_donation;

-- Above-average donation subquery
SELECT
    fd.food_name,
    fd.quantity,
    fd.location
FROM food_donation fd
WHERE fd.quantity > (
    SELECT AVG(fd2.quantity)
    FROM food_donation fd2
);

-- Donor-wise donation summary
SELECT
    d.name AS donor_name,
    COUNT(fd.donation_id) AS total_donations,
    COALESCE(SUM(fd.quantity), 0) AS total_quantity
FROM food_donor d
LEFT JOIN food_donation fd
    ON d.donor_id = fd.donor_id
GROUP BY d.donor_id, d.name
ORDER BY total_quantity DESC;

-- Allocation percentage
SELECT
    fd.food_name,
    fd.quantity AS donated_quantity,
    COALESCE(SUM(a.allocated_quantity), 0) AS allocated_quantity,
    ROUND(
        COALESCE(SUM(a.allocated_quantity), 0)
        * 100 / fd.quantity,
        2
    ) AS allocation_percentage
FROM food_donation fd
LEFT JOIN allocation a
    ON fd.donation_id = a.donation_id
GROUP BY
    fd.donation_id,
    fd.food_name,
    fd.quantity
ORDER BY allocation_percentage DESC;

-- ============================================================
-- 16. FINAL VERIFICATION
-- ============================================================

SHOW TABLES;

SHOW FULL TABLES
WHERE TABLE_TYPE = 'VIEW';

SHOW PROCEDURE STATUS
WHERE Db = DATABASE();

SHOW FUNCTION STATUS
WHERE Db = DATABASE();

SHOW TRIGGERS;

SHOW INDEX FROM food_donation;

SELECT
    fd.food_name,
    fd.quantity AS donated_quantity,
    COALESCE(SUM(a.allocated_quantity), 0) AS allocated_quantity,
    fd.quantity - COALESCE(SUM(a.allocated_quantity), 0) AS remaining_quantity
FROM food_donation fd
LEFT JOIN allocation a
    ON fd.donation_id = a.donation_id
GROUP BY
    fd.donation_id,
    fd.food_name,
    fd.quantity
ORDER BY fd.food_name;

-- ============================================================
-- END OF ECOFOODSYNC SQL SCRIPT
-- ============================================================
