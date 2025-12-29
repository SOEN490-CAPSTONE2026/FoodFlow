
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
cd .. && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local