# Local Development Setup (Docker-Free)

This guide explains how to set up and run the backend and frontend **locally**, without Docker.  
> All developers will use the **`local` Spring profile**.

---

# MAC USERS

## 1. Install PostgreSQL

The backend requires a local PostgreSQL instance.

### macOS (Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

## 2. Make scripts executable
```bash
cd backend/backend_scripts
chmod +x start-local-db.sh

cd ../frontend/frontend_scripts
chmod +x start-frontend.sh
```

## 3. Run scripts (start with the backend script)
```bash
cd backend/backend_scripts
./start-local-db.sh

cd ../frontend/frontend_scripts
./start-frontend.sh
```

# WINDOWS USERS

## 1. Install PostgreSQL
Install PostgreSQL using **Chocolatey** (recommended).


### How to install Chocolatey (if not installed)
Open **PowerShell as Administrator** and run:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

As a fallback, you can manually install Chocolatey by following the official guide on the Chocolatey website. After installation, close and reopen PowerShell so the choco command is available.

## 2. Run scripts (start with the backend script)
```bash
cd backend\\backend_scripts
powershell -ExecutionPolicy Bypass -File .\\start-local-db.ps1

cd frontend\\frontend_scripts
powershell -ExecutionPolicy Bypass -File .\\start-frontend.ps1
```
