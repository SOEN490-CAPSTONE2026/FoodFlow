# ===============================
# Load environment variables
# ===============================
$envFile = Join-Path $PSScriptRoot ".." ".." ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
    Write-Host "Environment variables loaded from .env"
} else {
    Write-Host "Warning: .env file not found at $envFile"
}

# ===============================
# Setup local PostgreSQL database
# ===============================

# Check if psql exists
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "Error: psql not found. Install PostgreSQL first!"
    exit 1
}

# Create user if it doesn't exist
$userExists = psql postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$env:POSTGRES_USER'"
if (-not $userExists) {
    psql postgres -c "CREATE USER $env:POSTGRES_USER WITH PASSWORD '$env:POSTGRES_PASSWORD';"
}

# Create database if it doesn't exist
$dbExists = psql postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$env:POSTGRES_DB'"
if (-not $dbExists) {
    psql postgres -c "CREATE DATABASE $env:POSTGRES_DB OWNER $env:POSTGRES_USER;"
}

Write-Host "Local DB setup complete. Starting backend with local profile..."
Set-Location ..
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
