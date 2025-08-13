# Telegram Authentication System

A complete authentication system with NestJS (backend), Telegraf (Telegram bot), and React (frontend) that allows users to log in via Telegram by scanning a QR code or clicking a deep link.

## Features

- Telegram authentication via QR code or deep link
- Real-time authentication status updates using WebSockets
- JWT-based authentication
- PostgreSQL database for user and session storage
- Docker support for easy deployment

## Architecture

### Flow

1. **Frontend**:
   - User clicks "Login with Telegram"
   - GET `/auth/telegram/session` is called on the backend
   - Backend generates a sessionToken (UUID) and returns it
   - Frontend displays a QR code or link: `https://t.me/YOUR_BOT?start=<sessionToken>`
   - Frontend opens a WebSocket connection to the backend with the same sessionToken and waits for authentication status

2. **User opens the bot**:
   - The bot receives `/start <sessionToken>`
   - The bot sends a "Share phone number" button (request_contact)

3. **User shares phone number**:
   - Bot collects: name, phone, photo, telegramId, username
   - Bot sends POST `/auth/telegram/complete` to backend:
     ```json
     {
       "sessionToken": "<sessionToken>",
       "name": "...",
       "phone": "...",
       "telegramId": "...",
       "username": "...",
       "photo": "..."
     }
     ```

4. **Backend**:
   - Matches the sessionToken to the pending session
   - Creates a new user or finds existing
   - Generates JWT
   - Sends `{ status: "success", jwt: "..." }` via WebSocket to the matching frontend connection

5. **Frontend**:
   - Receives JWT from WebSocket
   - Stores JWT in localStorage or cookie
   - Automatically logs the user in

## Project Structure

```
├── src/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── telegram-auth.controller.ts
│   │   │   ├── telegram-auth.service.ts
│   │   │   ├── telegram-auth.module.ts
│   │   │   ├── telegram-bot.service.ts
│   │   │   ├── telegram-session.entity.ts
│   │   │   └── telegram-websocket.gateway.ts
│   │   └── ...
│   └── ...
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.js
│       ├── index.js
│       └── index.css
├── docker-compose.yml
└── .env
```

## Setup

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- Telegram Bot Token

### Backend Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables in `.env`:
   ```env
   # Server Configuration
   PORT=4000
   DOMAIN=http://localhost:4000

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASS=postgres
   DB_NAME=telegram_auth

   # JWT Configuration
   ACCESS_TOKEN_KEY=your-access-token-secret-key
   ACCESS_TOKEN_TIME=15m
   REFRESH_TOKEN_KEY=your-refresh-token-secret-key
   REFRESH_TOKEN_TIME=7d
   JWT_SECRET=your-jwt-secret

   # Telegram Configuration
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   TELEGRAM_BOT_NAME=your-telegram-bot-name

   # Frontend Configuration
   FRONTEND_SOCIAL_LOGIN_URL=http://localhost:3001
   ```

3. Start the database (using Docker):
   ```bash
   # If you have Docker and Docker Compose installed:
   docker-compose up -d
   
   # Or install PostgreSQL manually and create the database:
   # createdb telegram_auth
   ```

4. Run the backend:
   ```bash
   pnpm run start:dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the frontend:
   ```bash
   pnpm start
   ```

## API Endpoints

### Telegram Authentication

- `GET /auth/telegram/session` - Create a new authentication session
- `POST /auth/telegram/complete` - Complete the authentication process

### WebSocket Events

- `join_session` - Join a session room with sessionToken
- `auth_result` - Receive authentication result (success/error)

## Security

- Session tokens expire after 2 minutes if unused
- JWT tokens are signed securely
- WebSocket authentication only sends JWT to the matching sessionToken

## License

MIT
