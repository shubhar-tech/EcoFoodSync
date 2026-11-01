# EcoFoodSync: Polyglot Database System for Automated Perishable Food Rescue

## 1. Project Overview

EcoFoodSync is a database-driven food rescue management system designed to reduce food wastage by connecting food donors with charities and NGOs.

The system manages surplus food donations, recipient requests, food allocations, volunteers, and pickup and delivery operations.

It uses a **Polyglot Database Architecture**, combining MySQL and MongoDB to manage structured operational data and flexible food-condition records.

## 2. Problem Statement

A significant amount of edible food is wasted by restaurants, supermarkets, and other food businesses, while charities and NGOs require food supplies.

EcoFoodSync aims to provide an organised database solution to manage food donations, track availability, allocate food to charities, and maintain delivery information.

## 3. Objectives

- Manage food donors and donation records.
- Maintain charity and NGO information.
- Track food requests and allocations.
- Manage volunteers and pickup/delivery activities.
- Maintain data integrity using database constraints.
- Perform efficient data retrieval and analysis using SQL.
- Store flexible food-condition records using MongoDB.

## 4. Technology Stack

| Component | Technology |
|---|---|
| Relational Database | MySQL 8.0 |
| NoSQL Database | MongoDB Atlas |
| SQL Language | MySQL SQL |
| Document Storage | MongoDB BSON |
| Database Tools | MySQL Workbench, MongoDB Atlas |

## 5. Database Architecture

### A. SQL – MySQL 8.0

MySQL is used to manage structured relational data.

The project contains seven core tables:

1. FOOD_DONOR
2. FOOD_DONATION
3. CHARITY_OR_NGO
4. ALLOCATION
5. VOLUNTEER
6. PICKUP_DELIVERY
7. FOOD_REQUEST

**SQL concepts implemented:**
- Database and table creation (DDL).
- INSERT, UPDATE and DELETE operations (DML).
- Primary keys and foreign keys.
- NOT NULL, UNIQUE and CHECK constraints.
- ALTER TABLE operations.
- Joins and nested queries.
- Aggregate functions.
- GROUP BY, HAVING and ORDER BY.
- Views and indexes.
- Stored procedures and functions.
- Triggers and transactions.
- Cursors and Common Table Expressions (CTEs).

### B. NoSQL – MongoDB Atlas

MongoDB Atlas is used for flexible food-condition records.

**Database:** EcoFoodSync

**Collection:** food_condition_logs

The collection stores food-condition information such as:
- Donation ID
- Food name
- Quantity
- Food condition
- Location
- Donation status
- Expiry time
- Historical snapshot information

**Verified operations:**
- Database and collection creation.
- Insert a historical donation document.
- Retrieve the document using find().

Additional MongoDB operations, including update, delete, aggregation and indexing, require execution and verification.

## 6. Polyglot Database Approach

The project combines two database technologies:

- **MySQL:** Maintains structured data, relationships and referential integrity.
- **MongoDB:** Stores flexible food-condition documents and historical snapshots.

The common `donation_id` is used as a logical reference between the two databases.

## 7. Project Structure

```text
EcoFoodSync/
│
├── README.md
├── DBMS_MINIPROJECT.docx
│
├── PES2UG24CS660_EcoFoodSync.sql
│
└── Other SQL implementation files
```

## 8. Expected Benefits

- Reduces food wastage through organised donation management.
- Improves coordination between donors and charities.
- Helps track food allocation and delivery.
- Maintains structured and flexible data using multiple database technologies.
- Demonstrates practical applications of SQL and NoSQL databases.

## 9. Future Enhancements

- Complete and verify additional MongoDB operations.
- Integrate MySQL and MongoDB through a backend application.
- Develop a user-friendly interface.
- Introduce real-time food availability tracking.
- Add food-condition monitoring and reporting.

## 10. Team Details

**Team:** G14

**Team Members:**
- PES2UG24CS660
- PES2UG24CS676

**Institution:** PES University, Bengaluru

**Department:** Computer Science and Engineering

## 11. Conclusion

EcoFoodSync demonstrates the application of relational and NoSQL database technologies to address food wastage and food redistribution challenges.

By combining MySQL 8.0 and MongoDB Atlas, the project illustrates a polyglot database approach for managing structured operational records and flexible food-condition information.
