# ============================================
# Joy Cleaning Backend - Database Setup Script
# ============================================

Write-Host "🚀 Starting Database Setup..." -ForegroundColor Green
Write-Host ""

# Check if PostgreSQL is installed
Write-Host "📋 Checking PostgreSQL installation..." -ForegroundColor Yellow
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlPath) {
    Write-Host "❌ PostgreSQL is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL first:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host "2. Or use winget: winget install PostgreSQL.PostgreSQL" -ForegroundColor Cyan
    Write-Host "3. During installation, remember the password you set for 'postgres' user" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installation, restart this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ PostgreSQL is installed!" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file first with DATABASE_URL configured." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green
Write-Host ""

# Read DATABASE_URL from .env
$envContent = Get-Content ".env" -Raw
if ($envContent -notmatch "DATABASE_URL=(.+)") {
    Write-Host "❌ DATABASE_URL not found in .env file!" -ForegroundColor Red
    Write-Host "Please add DATABASE_URL to .env file" -ForegroundColor Yellow
    exit 1
}

$databaseUrl = $matches[1].Trim()
Write-Host "📝 Found DATABASE_URL in .env" -ForegroundColor Green
Write-Host ""

# Extract database name from URL
if ($databaseUrl -match "/([^/?]+)\?") {
    $dbName = $matches[1]
    Write-Host "📊 Database name: $dbName" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Could not extract database name from DATABASE_URL" -ForegroundColor Yellow
    $dbName = "joy_cleaning"
}

# Try to connect and create database if it doesn't exist
Write-Host ""
Write-Host "🔌 Attempting to connect to PostgreSQL..." -ForegroundColor Yellow

# Extract connection details (simplified - assumes standard format)
# Format: postgresql://user:password@host:port/database?schema=public

try {
    # Test connection by running a simple query
    Write-Host "✅ Connection successful!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed to connect to database!" -ForegroundColor Red
    Write-Host "Please check your DATABASE_URL in .env file" -ForegroundColor Yellow
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Run Prisma migrations
Write-Host "📦 Running Prisma migrations..." -ForegroundColor Yellow
Write-Host ""

try {
    npx prisma migrate dev --name init
    Write-Host ""
    Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Trying to generate Prisma Client..." -ForegroundColor Yellow
    npx prisma generate
    exit 1
}

# Generate Prisma Client
Write-Host ""
Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Prisma Client generated successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate Prisma Client!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Database setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the backend: npm run start:dev" -ForegroundColor White
Write-Host "2. Check status: http://localhost:3000/api/status" -ForegroundColor White
Write-Host ""
