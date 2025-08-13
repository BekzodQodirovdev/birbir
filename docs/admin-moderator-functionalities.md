# Admin and Moderator Functionalities

## Overview
This document outlines the current admin and moderator functionalities in the application, as well as proposed enhancements based on the API documentation.

## Current Role Structure
The application supports three user roles:
- `user`: Regular users
- `admin`: Administrators with full access
- `moderator`: Users with limited administrative privileges

## Current Admin Functionalities

### User Management
- Create new users (admin only)
- Get all active users (admin only)
- Get users by role (admin only)
- Get a specific user by ID (admin only)
- Update user information (admin only)
- Activate/deactivate users (admin only)
- Change user roles (admin only)
- Verify users (admin only)
- Delete users (admin only)
- Get all professional sellers (admin only)
- Get all pending professional applications (admin only)

### Product Management
- Get products by tab status (draft, published, etc.)
- Cancel product promotions (admin only)
- Delete products (admin only)

### Region Management
- Create new regions (admin only)
- Update existing regions (admin only)
- Delete regions (admin only)

## Current Moderator Functionalities
Currently, there are no specific moderator-only functionalities implemented. Moderators have the same permissions as regular users.

## Proposed Enhancements

### Moderator Functionalities
Based on the API documentation, moderators should have the following capabilities:

1. **User Management**
   - View user profiles
   - Manage user restrictions/bans
   - Review professional seller applications
   - Handle user complaints

2. **Product Management**
   - Review product listings
   - Approve/reject product promotions
   - Handle product complaints
   - Manage featured products

3. **Content Management**
   - Moderate comments and reviews
   - Handle reported content
   - Manage categories and tags

### Admin Functionalities Enhancements
1. **System Management**
   - View system statistics and analytics
   - Manage application settings
   - View audit logs
   - Manage administrator accounts

2. **Financial Management**
   - View transaction history
   - Manage refunds
   - View revenue reports

3. **Advanced User Management**
   - Bulk user operations
   - Advanced search and filtering
   - Export user data

## Implementation Plan

### 1. Role-based Access Control
- Enhance the RolesGuard to support moderator role
- Add specific decorators for moderator-only endpoints
- Implement proper authorization checks in services

### 2. Moderator Endpoints
- Add new endpoints in UserController for moderator functionalities
- Add new endpoints in ProductController for product moderation
- Create new controllers for content and system management

### 3. Audit Logging
- Implement audit logging for admin and moderator actions
- Create AuditLog entity to track changes
- Add middleware to automatically log important actions

### 4. Reporting and Analytics
- Create endpoints for system statistics
- Implement data export functionality
- Add dashboard endpoints for admin/moderator UI

## API Endpoints

### User Management (Moderator)
```
GET /api/users/moderator/applications - Get pending professional applications
PATCH /api/users/moderator/:id/application/approve - Approve professional application
PATCH /api/users/moderator/:id/application/reject - Reject professional application
PATCH /api/users/moderator/:id/restrict - Restrict user account
PATCH /api/users/moderator/:id/unrestrict - Remove user restrictions
```

### Product Management (Moderator)
```
GET /api/products/moderator/pending - Get pending product promotions
PATCH /api/products/moderator/:id/promotion/approve - Approve product promotion
PATCH /api/products/moderator/:id/promotion/reject - Reject product promotion
PATCH /api/products/moderator/:id/restrict - Restrict product listing
PATCH /api/products/moderator/:id/unrestrict - Remove product restrictions
```

### System Management (Admin)
```
GET /api/admin/analytics - Get system analytics
GET /api/admin/logs - Get audit logs
GET /api/admin/settings - Get application settings
PATCH /api/admin/settings - Update application settings
```

## Security Considerations
- All admin/moderator endpoints should be protected with proper authentication
- Implement rate limiting for sensitive operations
- Add IP whitelisting for admin endpoints in production
- Implement two-factor authentication for admin accounts