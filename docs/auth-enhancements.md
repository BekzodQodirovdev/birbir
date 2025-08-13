# Authentication and Authorization Enhancements

## Overview
This document outlines the enhancements to the authentication and authorization system based on the API documentation requirements.

## Current Implementation
The current implementation includes:
- JWT-based authentication
- Role-based access control (user, admin, moderator)
- Social login (Telegram)
- Basic session management

## Enhanced Implementation

### Authentication Methods
1. **Email/Password Authentication**
   - User registration with email verification
   - Password reset functionality
   - Two-factor authentication (2FA)

2. **Social Authentication**
   - Telegram login (already implemented)
   - Google login
   - Facebook login
   - Apple login

3. **Phone Number Authentication**
   - SMS verification
   - Phone number as primary identifier

### Authorization Enhancements
1. **Enhanced Role System**
   - User roles: user, professional_seller, moderator, admin
   - Permission-based access control (PBAC)
   - Role inheritance

2. **Session Management**
   - Refresh tokens
   - Session tracking
   - Device management
   - Session expiration

3. **Security Features**
   - Rate limiting
   - IP whitelisting/blacklisting
   - Account lockout after failed attempts
   - Password strength requirements

### API Endpoints
```
POST /api/auth/register - User registration
POST /api/auth/login - User login
POST /api/auth/logout - User logout
POST /api/auth/refresh - Refresh access token
POST /api/auth/forgot-password - Request password reset
POST /api/auth/reset-password - Reset password
POST /api/auth/verify-email - Verify email address
POST /api/auth/enable-2fa - Enable two-factor authentication
POST /api/auth/disable-2fa - Disable two-factor authentication
POST /api/auth/verify-2fa - Verify two-factor authentication code
GET /api/auth/sessions - Get active sessions
DELETE /api/auth/sessions/:id - Logout from specific session
DELETE /api/auth/sessions/all - Logout from all sessions
```

### User Entity Updates
Add new fields to track authentication information:
- `email_verified` - Whether email is verified
- `password_reset_token` - Token for password reset
- `password_reset_expires` - Expiration time for password reset token
- `two_factor_enabled` - Whether 2FA is enabled
- `two_factor_secret` - 2FA secret key
- `refresh_token` - Refresh token for session management
- `last_login_at` - Timestamp of last login
- `login_attempts` - Number of failed login attempts
- `locked_until` - Account lockout expiration time

### Service Methods
Enhance AuthService with:
- `registerUser(data: RegisterUserDto)` - Register a new user
- `loginUser(data: LoginUserDto)` - Login a user
- `logoutUser(userId: string)` - Logout a user
- `refreshToken(refreshToken: string)` - Refresh access token
- `forgotPassword(email: string)` - Request password reset
- `resetPassword(token: string, newPassword: string)` - Reset password
- `verifyEmail(token: string)` - Verify email address
- `enableTwoFactor(userId: string)` - Enable two-factor authentication
- `disableTwoFactor(userId: string)` - Disable two-factor authentication
- `verifyTwoFactor(userId: string, token: string)` - Verify two-factor authentication code
- `getActiveSessions(userId: string)` - Get active sessions for user
- `logoutFromSession(userId: string, sessionId: string)` - Logout from specific session
- `logoutFromAllSessions(userId: string)` - Logout from all sessions

### Security Middleware
Implement security middleware:
- `RateLimitingMiddleware` - Rate limiting for authentication endpoints
- `IPWhitelistMiddleware` - IP whitelisting for admin endpoints
- `AccountLockoutMiddleware` - Account lockout after failed attempts