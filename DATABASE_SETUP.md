# Database Setup Guide

## Quick Setup (Automated)

Run the PowerShell script:
```powershell
.\setup-database.ps1
```

## Manual Setup

### Step 1: Install PostgreSQL

**Option A: Download Installer**
1. Go to: https://www.postgresql.org/download/windows/
2. Download PostgreSQL installer
3. Run installer and follow instructions
4. **Remember the password** you set for `postgres` user (default username)

**Option B: Using winget (Windows Package Manager)**
```powershell
winget install PostgreSQL.PostgreSQL
```

**Option C: Using Chocolatey (if installed)**
```powershell
choco install postgresql
```

### Step 2: Verify Installation

```powershell
psql --version
```

### Step 3: Start PostgreSQL Service

PostgreSQL service should start automatically. If not:
1. Open **Services** (Win + R → `services.msc`)
2. Find `postgresql-x64-XX` service
3. Right-click → Start

### Step 4: Create Database

**Method 1: Using psql command line**
```powershell
# Connect to PostgreSQL (default user: postgres)
psql -U postgres

# Enter password when prompted
# Then run:
CREATE DATABASE joy_cleaning;

# Exit
\q
```

**Method 2: Using pgAdmin (GUI)**
1. Open **pgAdmin** (installed with PostgreSQL)
2. Connect to PostgreSQL server
3. Right-click on **Databases** → **Create** → **Database**
4. Name: `joy_cleaning`
5. Click **Save**

### Step 5: Update .env File

Make sure your `.env` file has correct `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/joy_cleaning?schema=public
```

Replace:
- `postgres` → Your PostgreSQL username (if different)
- `YOUR_PASSWORD` → Password you set during installation
- `5432` → Port (default is 5432)
- `joy_cleaning` → Database name

### Step 6: Run Prisma Migrations

```powershell
npx prisma migrate dev --name init
```

This will:
- Create migration files
- Create tables in database
- Generate Prisma Client

### Step 7: Generate Prisma Client (if needed)

```powershell
npx prisma generate
```

### Step 8: Verify Setup

**Option 1: Using Prisma Studio (GUI)**
```powershell
npx prisma studio
```
Opens browser at http://localhost:5555

**Option 2: Using psql**
```powershell
psql -U postgres -d joy_cleaning
\dt  # List tables
\d clients  # Describe clients table
\q  # Exit
```

## Troubleshooting

### Error: "password authentication failed"
- Check your password in `.env` file
- Make sure password matches what you set during PostgreSQL installation
- Try resetting PostgreSQL password

### Error: "database does not exist"
- Create database first (Step 4)
- Check database name in `DATABASE_URL`

### Error: "connection refused" or "could not connect"
- Make sure PostgreSQL service is running
- Check if port 5432 is correct
- Verify host is `localhost`

### Error: "relation already exists"
- Database already has tables
- Run: `npx prisma migrate reset` (⚠️ deletes all data)
- Or: `npx prisma migrate deploy` (for production)

### psql command not found
- PostgreSQL not installed or not in PATH
- Add PostgreSQL bin folder to PATH:
  - Usually: `C:\Program Files\PostgreSQL\XX\bin`
  - Or reinstall PostgreSQL

## Quick Commands Reference

```powershell
# Check PostgreSQL version
psql --version

# Connect to PostgreSQL
psql -U postgres

# Create database (inside psql)
CREATE DATABASE joy_cleaning;

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

## Next Steps

After database setup:
1. Start backend: `npm run start:dev`
2. Check status: http://localhost:3000/api/status
3. Webhooks will auto-register on startup
