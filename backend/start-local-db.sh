#!/bin/zsh
# ===============================
# Setup local PostgreSQL database
# ===============================

DB_NAME="foodflow"
DB_USER="admin"
DB_PASS="admin"

# Check if Postgres is installed
if ! command -v psql &> /dev/null
then
    echo "Error: psql not found. Install PostgreSQL first!"
    exit 1
fi

# Create user if it doesn't exist
psql postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
psql postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

# Create database if it doesn't exist
psql postgres -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
psql postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

echo "Local DB setup complete. Starting backend with local profile..."
./mvnw spring-boot:run -Dspring-boot.run.profiles=local

