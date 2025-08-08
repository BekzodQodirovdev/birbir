# BirBir - Marketplace API

A comprehensive marketplace API built with NestJS, featuring social login, product management, and user engagement tracking.

## Features

- 🔐 **Social Login**: Google, Facebook, Apple, and Telegram authentication
- 📱 **Phone OTP**: Optional phone number verification
- 🛍️ **Product Management**: Full CRUD with image uploads
- 📊 **Engagement Tracking**: Views, likes, calls, contacts, favorites
- 🎯 **Advertising System**: Maxi, Premium, and Urgent promotions
- 📄 **Pagination**: All list endpoints support pagination
- 🔍 **Search & Filter**: Advanced product search and filtering
- 👥 **User Profiles**: Professional seller applications
- 📸 **Image Management**: Multiple images per product with main image support

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT + Passport.js
- **File Upload**: Multer + Sharp
- **Documentation**: Swagger/OpenAPI
- **Social Login**: Google OAuth, Facebook OAuth, Apple Sign-In, Telegram

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd BirBir
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Setup**
   Create a `.env` file based on `.env.example`:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=birbir_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# App
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback

# Apple Sign-In
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY_PATH=path/to/your/apple/private/key.p8
APPLE_CALLBACK_URL=http://localhost:3000/auth/apple/callback

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

4. **Database Setup**

```bash
# Run migrations
npm run migration:run

# Or if using TypeORM CLI
npx typeorm migration:run
```

5. **Start the application**

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Social Login Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs: `http://localhost:3000/auth/facebook/callback`
5. Copy App ID and App Secret to `.env`

### Apple Sign-In

1. Go to [Apple Developer](https://developer.apple.com/)
2. Create App ID with Sign In capability
3. Create Service ID
4. Generate private key
5. Copy all credentials to `.env`

### Telegram Login Widget

1. Create a bot with [@BotFather](https://t.me/botfather)
2. Get bot token
3. Add to `.env`
4. Use Telegram Login Widget in frontend

## API Documentation

Once the application is running, visit:

- **Swagger UI**: `http://localhost:3000/api`
- **API Base URL**: `http://localhost:3000`

## Authentication Endpoints

### Phone OTP (Optional)

- `POST /auth/send-otp` - Send OTP to phone number
- `POST /auth/verify-otp` - Verify OTP and login/register

### Social Login

- `POST /auth/google` - Login with Google
- `POST /auth/facebook` - Login with Facebook
- `POST /auth/apple` - Login with Apple
- `POST /auth/telegram` - Login with Telegram

### OAuth Callbacks

- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/facebook/callback` - Facebook OAuth callback
- `GET /auth/apple/callback` - Apple Sign-In callback

### User Management

- `GET /auth/profile` - Get current user profile
- `GET /auth/verify-token` - Verify JWT token
- `POST /auth/register` - Register new user

## Product Endpoints

### Basic CRUD

- `GET /products` - Get all products (paginated)
- `POST /products` - Create new product
- `GET /products/:id` - Get product by ID
- `PATCH /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Search & Filter

- `GET /products/search?q=query` - Search products
- `GET /products/category/:category` - Filter by category
- `GET /products/condition/:condition` - Filter by condition
- `GET /products/price-range?min=100&max=1000` - Filter by price range
- `GET /products/free` - Get free products
- `GET /products/urgent` - Get urgent products
- `GET /products/with-delivery` - Get products with delivery

### Image Management

- `POST /products/:id/images` - Upload product images (max 6)
- `PATCH /products/:id/images/:imageId/main` - Set main image
- `DELETE /products/:id/images/:imageId` - Delete image
- `PATCH /products/:id/images/reorder` - Reorder images

### Engagement

- `POST /products/:id/like` - Add like
- `DELETE /products/:id/like` - Remove like
- `POST /products/:id/call` - Add call
- `POST /products/:id/contact` - Add contact
- `POST /products/:id/favorite` - Add to favorites
- `DELETE /products/:id/favorite` - Remove from favorites

### Advertising

- `GET /products/promotion/options` - Get promotion options
- `POST /products/:id/promote` - Create promotion
- `DELETE /products/:id/promote` - Cancel promotion
- `GET /products/promoted` - Get promoted products

### Analytics

- `GET /products/:id/stats` - Get product statistics
- `GET /products/:id/engagement` - Get engagement data
- `GET /products/my-products/engagement` - Get user's products engagement

### Recommendations

- `GET /products/:id/similar` - Get similar products
- `GET /products/:id/seller-other-products` - Get seller's other products

## User Endpoints

### Profile Management

- `GET /users/profile/stats` - Get profile statistics
- `PATCH /users/profile` - Update profile
- `GET /users/contact-preferences` - Get contact preferences
- `PATCH /users/contact-preferences` - Update contact preferences

### Professional Seller

- `POST /users/professional-application` - Submit application
- `GET /users/professional-application` - Get application status
- `GET /users/professional-sellers` - Get all professional sellers (admin)
- `PATCH /users/:id/approve-application` - Approve application (admin)
- `PATCH /users/:id/reject-application` - Reject application (admin)

## File Upload

- **Max file size**: 10MB
- **Supported formats**: JPEG, JPG, PNG, WebP
- **Auto resize**: Images are automatically resized to max 1920x1080
- **Storage**: Local file system (uploads/ directory)

## Pagination

All list endpoints support pagination with query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Example:

```
GET /products?page=1&limit=20
```

Response format:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Development

### Running Tests

```bash
npm run test
npm run test:e2e
```

### Database Migrations

```bash
# Generate migration
npm run migration:generate -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

### Code Formatting

```bash
npm run format
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
