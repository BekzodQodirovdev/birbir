# API Documentation for Frontend Integration

## Introduction

This document provides comprehensive guidance for frontend developers on how to integrate with the Bir Bir API. This is a NestJS-based backend API for a marketplace application with features like product listings, user management, authentication via Telegram, and more.

## Base URL and Setup

- **Base URL**: `http://localhost:4000/api` (for local development)
- **Global Prefix**: All endpoints are prefixed with `/api`
- **CORS**: Enabled for all origins (`*`)
- **Rate Limiting**: 3 requests per second (short TTL)
- **Authentication**: JWT Bearer tokens required for protected endpoints
- **API Documentation**: Swagger UI available at `/api/docs`

## Authentication

The API uses Telegram-based authentication. Here's how to handle authentication from the frontend:

### 1. Telegram Authentication Flow

#### Step 1: Create Session

**Endpoint**: `GET /api/auth/telegram/session`
**Description**: Generates a session token for Telegram authentication flow
**Response**:

```json
{
  "sessionToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Step 2: Complete Authentication

**Endpoint**: `POST /api/auth/telegram/complete`
**Description**: Finishes the Telegram authentication process
**Request Body**:

```json
{
  "sessionToken": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "phone": "+998901234567",
  "telegramId": "123456789",
  "username": "johndoe",
  "photo": "https://example.com/photo.jpg"
}
```

**Response**:

```json
{
  "status": "success",
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Step 3: Store JWT Token

Store the JWT token in localStorage or secure cookie for subsequent requests.

### Frontend Authentication Example

```javascript
// 1. Create session
const sessionResponse = await fetch('/api/auth/telegram/session');
const { sessionToken } = await sessionResponse.json();

// 2. Complete authentication (after Telegram login)
const completeResponse = await fetch('/api/auth/telegram/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sessionToken,
    name: userData.name,
    phone: userData.phone,
    telegramId: userData.telegramId,
    username: userData.username,
    photo: userData.photo,
  }),
});

const { jwt } = await completeResponse.json();
localStorage.setItem('authToken', jwt);
```

### Using JWT Token in Requests

For protected endpoints, include the JWT token in the Authorization header:

```javascript
const response = await fetch('/api/products', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
  },
});
```

## API Endpoints

### Products

#### Get All Products

**Endpoint**: `GET /api/products`
**Method**: GET
**Description**: Retrieve all active products with pagination
**Query Parameters**:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
  **Response**:

```json
{
  "data": [
    {
      "id": "product-id",
      "name": "Product Name",
      "description": "Product description",
      "price": 100,
      "stock": 5,
      "condition": "new",
      "is_negotiable": true,
      "is_urgent": false,
      "is_free": false,
      "has_delivery": true,
      "category": "Electronics",
      "location": "Tashkent",
      "latitude": 41.2995,
      "longitude": 69.2401,
      "is_active": true,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### Search Products

**Endpoint**: `GET /api/products/search`
**Method**: GET
**Query Parameters**:

- `q` (string): Search query
- `page` (number): Page number
- `limit` (number): Items per page
  **Example**: `/api/products/search?q=laptop&page=1&limit=10`

#### Get Product by ID

**Endpoint**: `GET /api/products/:id`
**Method**: GET
**Response**: Single product object

#### Create Product

**Endpoint**: `POST /api/products`
**Method**: POST
**Headers**: `Authorization: Bearer <token>`
**Request Body** (all fields are required unless marked optional):

```json
{
  "name": "iPhone 13", // string, required
  "description": "Latest iPhone model", // string, optional
  "price": 999, // number, required, minimum 0
  "stock": 1, // number, required, minimum 0
  "image_url": "https://example.com/image.jpg", // string, optional
  "condition": "new", // enum: "new" | "used", optional
  "is_negotiable": true, // boolean, optional
  "is_urgent": false, // boolean, optional
  "is_free": false, // boolean, optional
  "has_delivery": true, // boolean, optional
  "category": "Electronics", // string, optional
  "subcategory": "Smartphones", // string, optional
  "location": "Tashkent", // string, optional
  "latitude": 41.2995, // number, optional, must be valid latitude
  "longitude": 69.2401, // number, optional, must be valid longitude
  "is_active": true, // boolean, optional
  "slug": "iphone-13", // string, optional
  "status": 1, // number, optional
  "tab": "active", // string, optional
  "should_expired_at": "2023-12-31T23:59:59Z", // string, optional
  "first_published_at": "2023-01-01T00:00:00Z", // string, optional
  "publishable": true, // boolean, optional
  "issues": null, // string, optional
  "uuid": "550e8400-e29b-41d4-a716-446655440000", // string, optional, must be UUID
  "web_uri": "https://example.com/product/iphone-13", // string, optional
  "payload": "{}", // string, optional
  "promotion_data": "{}", // string, optional
  "statistics": "{}", // string, optional
  "notice_top": "Top notice", // string, optional
  "notice_bottom": "Bottom notice", // string, optional
  "delivery_enabled": true, // boolean, optional
  "gross_price": 999, // number, optional
  "gross_price_discount": 0, // number, optional
  "badges": "new,urgent" // string, optional
}
```

**Response**: Created product object

#### Update Product

**Endpoint**: `PATCH /api/products/:id`
**Method**: PATCH
**Headers**: `Authorization: Bearer <token>`
**Request Body**: Same as create, but all fields are optional
**Response**: Updated product object

#### Delete Product

**Endpoint**: `DELETE /api/products/:id`
**Method**: DELETE
**Headers**: `Authorization: Bearer <token>`
**Response**: Success message

#### Upload Product Images

**Endpoint**: `POST /api/products/:id/images`
**Method**: POST
**Headers**:

- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`
  **Body**: Form data with `images` field (up to 6 images, max 10MB each)
  **Response**: Uploaded images data

#### Add Product Engagement

**Endpoint**: `POST /api/products/:id/like`
**Method**: POST
**Headers**: `Authorization: Bearer <token>`
**Response**: Success message

### Users

#### Get Current User Profile

**Endpoint**: `GET /api/users/profile`
**Method**: GET
**Headers**: `Authorization: Bearer <token>`
**Response**:

```json
{
  "id": "user-id",
  "name": "John Doe",
  "phone_number": "+998901234567",
  "picture": "https://example.com/photo.jpg",
  "is_active": true,
  "role": "user",
  "created_at": "2023-01-01T00:00:00Z"
}
```

#### Update User Profile

**Endpoint**: `PATCH /api/users/:id`
**Method**: PATCH
**Headers**: `Authorization: Bearer <token>`
**Request Body** (all fields optional):

```json
{
  "name": "Updated Name", // string, optional
  "phone_number": "+998901234567", // string, optional
  "picture": "https://example.com/new-photo.jpg", // string, optional
  "is_active": true, // boolean, optional
  "role": "user" // enum: "user" | "admin", optional
}
```

**Response**: Updated user object

#### Create User (Admin Only)

**Endpoint**: `POST /api/users`
**Method**: POST
**Headers**: `Authorization: Bearer <token>` (admin role required)
**Request Body**:

```json
{
  "name": "New User", // string, required
  "phone_number": "+998901234567", // string, required
  "picture": "https://example.com/photo.jpg", // string, optional
  "is_active": true, // boolean, optional
  "role": "user" // enum: "user" | "admin", optional, default "user"
}
```

### Regions

#### Get All Regions

**Endpoint**: `GET /api/regions`
**Method**: GET
**Response**: Array of region objects

#### Get Region by ID

**Endpoint**: `GET /api/regions/:id`
**Method**: GET
**Response**: Single region object

## Error Handling

The API returns standard HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

Error response format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

Or for validation errors:

```json
{
  "statusCode": 400,
  "message": ["name must be a string", "price must be a number"],
  "error": "Bad Request"
}
```

## Frontend Integration Examples

### Using Fetch API

```javascript
// GET request
const fetchProducts = async () => {
  try {
    const response = await fetch('/api/products?page=1&limit=10', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error fetching products:', error);
  }
};

// POST request
const createProduct = async (productData) => {
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Product created:', data);
  } catch (error) {
    console.error('Error creating product:', error);
  }
};
```

### Using Axios

```javascript
import axios from 'axios';

// Set up axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
  },
});

// GET request
const fetchProducts = async () => {
  try {
    const response = await api.get('/products', {
      params: { page: 1, limit: 10 },
    });
    console.log(response.data);
  } catch (error) {
    console.error(
      'Error fetching products:',
      error.response?.data || error.message,
    );
  }
};

// POST request
const createProduct = async (productData) => {
  try {
    const response = await api.post('/products', productData);
    console.log('Product created:', response.data);
  } catch (error) {
    console.error(
      'Error creating product:',
      error.response?.data || error.message,
    );
  }
};
```

## File Upload

For image uploads, use FormData:

```javascript
const uploadImages = async (productId, files) => {
  const formData = new FormData();

  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }

  try {
    const response = await fetch(`/api/products/${productId}/images`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Images uploaded:', data);
  } catch (error) {
    console.error('Error uploading images:', error);
  }
};
```

## Pagination

Most list endpoints support pagination:

```javascript
// Example pagination implementation
const loadProducts = async (page = 1, limit = 10) => {
  const response = await fetch(`/api/products?page=${page}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });

  const data = await response.json();

  // data structure:
  // {
  //   data: [...], // array of products
  //   total: 100,  // total number of products
  //   page: 1,     // current page
  //   limit: 10    // items per page
  // }

  return data;
};
```

## WebSocket Support

The API supports WebSocket connections for real-time features. Use Socket.IO client:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

// Connect with authentication
socket.emit('authenticate', { token: localStorage.getItem('authToken') });

// Listen for events
socket.on('product:updated', (data) => {
  console.log('Product updated:', data);
});
```

## Environment Variables

For production deployment, set these environment variables:

- `PORT`: Server port (default: 4000)
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_USER`: Database username
- `DB_PASS`: Database password
- `DB_NAME`: Database name
- `FRONTEND_SOCIAL_LOGIN_URL`: Frontend URL for social login redirects

## Testing the API

1. Start the backend server: `npm run start:dev`
2. Visit Swagger UI: `http://localhost:4000/api/docs`
3. Test endpoints directly in the browser or use tools like Postman

## Common Issues and Solutions

1. **CORS Errors**: Ensure the frontend is running on a different port than the API
2. **401 Unauthorized**: Check if JWT token is valid and included in headers
3. **400 Bad Request**: Validate request body against DTO specifications
4. **Rate Limiting**: Implement debouncing for frequent requests
5. **File Upload Errors**: Ensure files are under size limits and correct format

## Support

For additional help:

- Check the Swagger documentation at `/api/docs`
- Review the source code for detailed implementation
- Contact the backend team for specific endpoint clarifications

This documentation covers the main aspects of integrating with the Bir Bir API. For more advanced features or specific use cases, refer to the Swagger documentation or consult with the development team.
