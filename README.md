# Joy Cleaning Backend

SaaS-based scalable backend for Joy Cleaning application with Jobber integration.

## Features

- ✅ NestJS + TypeScript
- ✅ PostgreSQL + Prisma ORM
- ✅ Jobber API Integration (GraphQL)
- ✅ Auto Webhook Registration
- ✅ Client Data Sync
- ✅ RESTful API Endpoints

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (will be set up later)
- Jobber Developer Account with App credentials

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# App Configuration
APP_URL=http://localhost:3000
PORT=3000

# Database (PostgreSQL - to be configured)
DATABASE_URL="postgresql://user:password@localhost:5432/joy_cleaning?schema=public"

# Jobber API Credentials
JOBBER_CLIENT_ID=your_client_id_here
JOBBER_CLIENT_SECRET=your_client_secret_here
JOBBER_ACCESS_TOKEN=your_access_token_here
JOBBER_GRAPHQL_VERSION=2025-04-16
JOBBER_WEBHOOK_SECRET=your_webhook_secret_here

# JWT Secret (generate a random string)
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Database Setup (To be done later)

Once PostgreSQL is installed:

```bash
# Create database
createdb joy_cleaning

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### 4. Run the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Endpoints

### Status & Health

- `GET /api/status` - Check backend status
- `GET /api/clients` - Get all clients
- `GET /api/sync-status` - Get sync status

### Webhooks (Jobber)

- `POST /webhooks/jobber/client/create` - Receive client create events
- `POST /webhooks/jobber/client/update` - Receive client update events
- `POST /webhooks/jobber/client/destroy` - Receive client destroy events

## Auto Webhook Registration

On application startup, webhooks are automatically registered with Jobber:
- CLIENT_CREATE
- CLIENT_UPDATE
- CLIENT_DESTROY

## Project Structure

```
src/
├── api/              # API endpoints (status, clients)
├── auth/             # Authentication module
├── clients/          # Client service & business logic
├── jobber/           # Jobber integration (GraphQL, webhooks)
├── prisma/           # Prisma service
├── webhooks/         # Webhook controllers
└── main.ts           # Application entry point
```

## Development

```bash
# Watch mode
npm run start:dev

# Build
npm run build

# Test
npm run test
```

## Notes

- Database setup will be done after PostgreSQL installation
- Webhook URLs should be publicly accessible (use ngrok for local testing)
- All webhooks are automatically registered on app startup
