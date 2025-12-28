# Check if npm exists
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npm not found. Install Node.js and npm first!"
    exit 1
}

# Navigate to frontend directory
Set-Location ..

# Install dependencies if missing
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..."
    npm install
}

# Start React development server
Write-Host "Starting frontend..."
npm start