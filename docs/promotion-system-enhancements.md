# Promotion System Enhancements

## Overview
This document outlines the enhancements to the promotion system based on the API documentation requirements.

## Current Implementation
The current implementation includes:
- Promotion options with different types (maxi, premium, urgent)
- Methods to create and cancel promotions
- Methods to get promoted products

## Enhanced Implementation

### Promotion Status Definitions
1. **Active**: Promotion is currently running
2. **Expired**: Promotion has expired
3. **Cancelled**: Promotion was cancelled by user
4. **Pending Payment**: Promotion created but payment not completed

### Promotion History Tracking
Add new fields to track promotion history:
- `promotion_history` - Array of previous promotions
- `total_promotion_spent` - Total amount spent on promotions
- `last_promotion_at` - Timestamp of last promotion

### Promotion Analytics
Add endpoints to track promotion performance:
- Views during promotion period
- Likes during promotion period
- Calls during promotion period
- Contacts during promotion period
- Favorites during promotion period

### Automatic Expiration Handling
Implement automatic expiration of promotions:
- Check promotion end date
- Automatically expire promotions
- Send notifications for expiring promotions

### API Endpoints
```
GET /api/products/promotion/history - Get promotion history for current user
GET /api/products/promotion/analytics/:id - Get promotion analytics for a product
GET /api/products/promotion/expiring - Get expiring promotions (admin)
POST /api/products/promotion/:id/extend - Extend promotion duration
POST /api/products/promotion/:id/reactivate - Reactivate expired promotion
```

### Product Entity Updates
Add new fields to track promotion information:
- `promotion_history` - JSON array of promotion records
- `total_promotion_spent` - Total amount spent on promotions
- `last_promotion_at` - Timestamp of last promotion
- `promotion_views_count` - Total views during promotion periods
- `promotion_likes_count` - Total likes during promotion periods
- `promotion_calls_count` - Total calls during promotion periods
- `promotion_contacts_count` - Total contacts during promotion periods
- `promotion_favorites_count` - Total favorites during promotion periods

### Service Methods
Enhance ProductService with:
- `getPromotionHistory(userId: string)` - Get promotion history for user
- `getPromotionAnalytics(productId: string)` - Get promotion analytics for product
- `extendPromotion(productId: string, days: number)` - Extend promotion duration
- `reactivatePromotion(productId: string)` - Reactivate expired promotion
- `expirePromotions()` - Expire expired promotions (cron job)
- `getExpiringPromotions(days: number)` - Get promotions expiring in specified days