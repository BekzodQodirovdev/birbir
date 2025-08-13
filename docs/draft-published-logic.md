# Draft/Published Logic for Products

## Overview
This document outlines the draft/published logic for products in the application, based on the API documentation requirements.

## Current Implementation
The current implementation includes:
- `tab` field in Product entity with values 'draft' or 'published'
- `publishable` boolean field to indicate if a product can be published
- `issues` field to track validation issues
- `first_published_at` field to track when a product was first published
- Methods in ProductService to check publishable status and publish/unpublish products

## Enhanced Implementation

### Product Status Definitions
1. **Draft**: Product is being created or edited, not visible to other users
2. **Published**: Product is active and visible to all users
3. **Unpublished**: Product was previously published but has been taken down
4. **Pending Review**: Product is waiting for admin/moderator approval
5. **Rejected**: Product has been rejected and needs corrections

### Validation Rules for Publishable Products
A product must meet the following criteria to be publishable:
1. Has a title (name)
2. Has a description
3. Has a price (unless it's free)
4. Has at least one image
5. Has a category
6. Has a location

### Automatic Status Transitions
1. When a new product is created, it starts in 'draft' status
2. When all validation issues are resolved, product becomes publishable
3. When a publishable product is published, status changes to 'published'
4. When a published product is unpublished, status changes to 'draft'
5. When a product is submitted for review, status changes to 'pending review'

### API Endpoints
```
GET /api/products/draft - Get draft products for current user
GET /api/products/published - Get published products for current user
GET /api/products/pending-review - Get products pending review (moderator)
POST /api/products/:id/publish - Publish a product
POST /api/products/:id/unpublish - Unpublish a product
POST /api/products/:id/submit-for-review - Submit product for review
GET /api/products/:id/publishable - Check if product is publishable and get issues
```

### Product Entity Updates
Add new fields to track additional status information:
- `status_reason` - Reason for current status
- `rejected_reason` - Reason for rejection (if applicable)
- `submitted_for_review_at` - Timestamp when submitted for review
- `last_reviewed_at` - Timestamp of last review
- `reviewed_by_id` - ID of moderator who last reviewed

### Service Methods
Enhance ProductService with:
- `submitForReview(productId: string)` - Submit product for moderation
- `approveProduct(productId: string)` - Approve product (moderator)
- `rejectProduct(productId: string, reason: string)` - Reject product (moderator)
- `getPendingReviewProducts()` - Get products pending review (moderator)
- `updateProductStatus(productId: string, status: string, reason?: string)` - Update product status