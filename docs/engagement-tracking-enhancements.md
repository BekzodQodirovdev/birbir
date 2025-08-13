# Engagement Tracking Enhancements

## Overview
This document outlines the enhancements to the engagement tracking system based on the API documentation requirements.

## Current Implementation
The current implementation includes:
- Methods to add/remove likes
- Methods to add calls and contacts
- Methods to add/remove favorites
- Basic engagement statistics

## Enhanced Implementation

### Engagement Types
1. **Views** - Track product views
2. **Likes** - Track product likes
3. **Calls** - Track calls to seller
4. **Contacts** - Track contact requests
5. **Favorites** - Track favorites
6. **Shares** - Track product shares
7. **Comments** - Track product comments
8. **Reports** - Track product reports

### Engagement History Tracking
Add new fields to track engagement history:
- `engagement_history` - Array of engagement events
- `daily_engagement_stats` - Daily engagement statistics
- `weekly_engagement_stats` - Weekly engagement statistics
- `monthly_engagement_stats` - Monthly engagement statistics

### Engagement Analytics
Add endpoints to track engagement analytics:
- Real-time engagement metrics
- Engagement trends over time
- Engagement by user demographics
- Engagement by product category

### API Endpoints
```
GET /api/products/:id/engagement/history - Get engagement history for a product
GET /api/products/:id/engagement/analytics - Get engagement analytics for a product
GET /api/users/:id/engagement/analytics - Get engagement analytics for a user
POST /api/products/:id/share - Add share to product
POST /api/products/:id/comment - Add comment to product
POST /api/products/:id/report - Report a product
GET /api/products/:id/comments - Get comments for a product
DELETE /api/products/:id/comments/:commentId - Delete a comment (user or admin)
```

### Product Entity Updates
Add new fields to track engagement information:
- `engagement_history` - JSON array of engagement events
- `shares_count` - Total shares count
- `comments_count` - Total comments count
- `reports_count` - Total reports count
- `daily_engagement_stats` - JSON object for daily stats
- `weekly_engagement_stats` - JSON object for weekly stats
- `monthly_engagement_stats` - JSON object for monthly stats

### User Entity Updates
Add new fields to track user engagement:
- `total_shares` - Total shares by user
- `total_comments` - Total comments by user
- `total_reports` - Total reports by user

### Service Methods
Enhance ProductService with:
- `addShare(productId: string)` - Add share to product
- `addComment(productId: string, userId: string, comment: string)` - Add comment to product
- `reportProduct(productId: string, userId: string, reason: string)` - Report a product
- `getComments(productId: string)` - Get comments for a product
- `deleteComment(productId: string, commentId: string)` - Delete a comment
- `getEngagementHistory(productId: string)` - Get engagement history for a product
- `getEngagementAnalytics(productId: string)` - Get engagement analytics for a product

Enhance UserService with:
- `getUserEngagementAnalytics(userId: string)` - Get engagement analytics for a user