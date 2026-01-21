
# ===============================
# Load environment variables
# ===============================
$envFile = Join-Path $PSScriptRoot "..\..\.env"
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

# Clean Maven build to remove stale compiled files (e.g., old migrations from other branches)
Write-Host "Cleaning Maven build artifacts..."
.\mvnw.cmd clean -q

# Attempt to start - capture output to check for Flyway errors
$tempLog = Join-Path $env:TEMP "foodflow-startup-$(Get-Date -Format 'yyyyMMddHHmmss').log"
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local" 2>&1 | Tee-Object -FilePath $tempLog
$startupExitCode = $LASTEXITCODE

# If startup failed, check if it's a Flyway validation issue
if ($startupExitCode -ne 0) {
    $logContent = Get-Content $tempLog -Raw
    if ($logContent -match "FlywayValidateException|Migration checksum mismatch") {
        Write-Host ""
        Write-Host "=========================================="
        Write-Host "⚠️  Flyway migration validation failed!"
        Write-Host "=========================================="
        Write-Host "This usually happens when:"
        Write-Host "  - You switched branches with different migrations"
        Write-Host "  - Migration files were modified after being applied"
        Write-Host ""
        Write-Host "🗑️  Automatically dropping and recreating database..."
        
        # Terminate all connections
        psql postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$env:POSTGRES_DB' AND pid <> pg_backend_pid();" 2>$null
        
        # Drop database
        $dropResult = psql postgres -c "DROP DATABASE IF EXISTS $env:POSTGRES_DB;" 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to drop database. Close all connections and try again."
            Remove-Item $tempLog -ErrorAction SilentlyContinue
            exit 1
        }
        
        # Recreate database
        psql postgres -c "CREATE DATABASE $env:POSTGRES_DB OWNER $env:POSTGRES_USER;"
        
        Write-Host "✅ Database recreated successfully!"
        Write-Host "🚀 Restarting backend with fresh migrations..."
        Write-Host ""
        
        # Clean up temp log and retry
        Remove-Item $tempLog -ErrorAction SilentlyContinue
        .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
    } else {
        Write-Host ""
        Write-Host "❌ Startup failed for reasons other than Flyway validation."
        Write-Host "   Check error messages above for details."
        Remove-Item $tempLog -ErrorAction SilentlyContinue
        exit 1
    }
} else {
    # Clean up temp log on success
    Remove-Item $tempLog -ErrorAction SilentlyContinue
}
