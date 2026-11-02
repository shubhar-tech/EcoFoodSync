## Overview
Integrated a Next.js web application into the existing EcoFoodSync repository to provide a web-based interface for managing food donations and coordinating food rescue activities.

## Changes Implemented
- Added a Next.js frontend with a dashboard and navigation.
- Added login, logout, registration, and role-based authentication.
- Integrated MySQL for relational application data.
- Integrated MongoDB for NoSQL data.
- Added API routes for:
  - Donations
  - Allocations
  - Food requests
  - Deliveries
  - Tracking
  - Directory
  - Audit logs
  - Dashboard statistics
  - Authentication
- Added database schema and demo-data SQL scripts.
- Added a user-seeding script for demo roles: ADMIN, DONOR, CHARITY, and VOLUNTEER.
- Added environment configuration examples and project documentation.

## Technology Stack
- Next.js
- React
- MySQL
- MongoDB
- Node.js

## Testing
- Verified that the Next.js production build completes successfully.
- Configured the local MySQL and MongoDB connections.
- Created and seeded demo user accounts.
- Tested the application locally.

## Notes
- Environment secrets are stored locally in `.env.local` and are not included in this commit.
- Existing SQL and project documentation files have been preserved.
- Changes are submitted through `feature/nextjs-web` for review before merging into `main`.

## Purpose
To extend EcoFoodSync with a web-based application while retaining the existing database and project structure.