# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "Error: npm not found. Install Node.js and npm first!"
    exit 1
fi

# Navigate to frontend directory
cd ..

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start React development server
echo "Starting frontend..."
npm start