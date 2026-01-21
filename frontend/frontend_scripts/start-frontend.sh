# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "Error: npm not found. Install Node.js and npm first!"
    exit 1
fi

# Navigate to frontend directory
cd ..

# Always install dependencies
echo "Installing frontend dependencies..."
npm install

# Start React development server
echo "Starting frontend..."
npm start
