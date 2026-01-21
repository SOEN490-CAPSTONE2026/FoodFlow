# Load env vars
# ===============================
if [ -f ../../.env ]; then
  export $(grep -v '^#' ../../.env | xargs)
fi

# ===============================
# Setup local PostgreSQL database
# ===============================
# ===============================

# Check if Postgres is installed
if ! command -v psql &> /dev/null
then
    echo "Error: psql not found. Install PostgreSQL first!"
    exit 1
fi

# Create user if it doesn't exist
psql postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='${POSTGRES_USER}'" | grep -q 1 || \
psql postgres -c "CREATE USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';"

# Create database if it doesn't exist
psql postgres -tc "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'" | grep -q 1 || \
psql postgres -c "CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};"

echo "Local DB setup complete. Starting backend with local profile..."
cd ..

# Clean Maven build to remove stale compiled files (e.g., old migrations from other branches)
echo "Cleaning Maven build artifacts..."
./mvnw clean -q

# Attempt to start - capture output to check for Flyway errors
TEMP_LOG="/tmp/foodflow-startup-$$.log"
./mvnw spring-boot:run -Dspring-boot.run.profiles=local 2>&1 | tee "$TEMP_LOG"
STARTUP_EXIT_CODE=${PIPESTATUS[0]}

# If startup failed, check if it's a Flyway validation issue
if [ $STARTUP_EXIT_CODE -ne 0 ]; then
    if grep -q "FlywayValidateException\|Migration checksum mismatch" "$TEMP_LOG"; then
        echo ""
        echo "=========================================="
        echo "⚠️  Flyway migration validation failed!"
        echo "=========================================="
        echo "This usually happens when:"
        echo "  - You switched branches with different migrations"
        echo "  - Migration files were modified after being applied"
        echo ""
        echo "🗑️  Automatically dropping and recreating database..."
        
        # Terminate all connections
        psql postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();" >/dev/null 2>&1
        
        # Drop database
        psql postgres -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};" || {
            echo "❌ Failed to drop database. Close all connections and try again."
            rm -f "$TEMP_LOG"
            exit 1
        }
        
        # Recreate database
        psql postgres -c "CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};"
        
        echo "✅ Database recreated successfully!"
        echo "🚀 Restarting backend with fresh migrations..."
        echo ""
        
        # Clean up temp log and retry
        rm -f "$TEMP_LOG"
        ./mvnw spring-boot:run -Dspring-boot.run.profiles=local
    else
        echo ""
        echo "❌ Startup failed for reasons other than Flyway validation."
        echo "   Check error messages above for details."
        rm -f "$TEMP_LOG"
        exit 1
    fi
else
    # Clean up temp log on success
    rm -f "$TEMP_LOG"
fi
