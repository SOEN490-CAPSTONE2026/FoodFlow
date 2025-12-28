# Local Development Setup (Docker-Free)

This guide explains how to set up and run the backend and frontend **locally**, without Docker.  
> All developers will use the **`local` Spring profile**.

---

## 1. Install PostgreSQL

The backend requires a local PostgreSQL instance.

### macOS (Homebrew)
```bash
brew install postgresql
brew services start postgresql
```
### Windows (Chocolatey)
```bash
choco install postgresql
net start postgresql
```

## 2. Make scripts executable
```bash
cd backend
chmod +x setup-local-db.sh

cd ../frontend
chmod +x start-frontend.sh
```

## 3. Run the scripts (start with the backend script)
```bash
cd backend
./setup-local-db.sh

cd ../frontend
./start-frontend.sh
```