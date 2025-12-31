if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npm not found. Install Node.js and npm first!"
    exit 1
}

# Navigate to frontend directory
Set-Location ..

# Always install dependencies
Write-Host "Installing frontend dependencies..."
npm install

# Start React development server
Write-Host "Starting frontend..."
npm start
