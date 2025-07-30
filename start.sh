#!/bin/bash

# Start script for Atlas ICP project
echo "🚀 Starting Atlas ICP development environment..."

# Check if dfx is installed
if ! command -v dfx &> /dev/null
then
    echo "❌ dfx is not installed. Please install the DFINITY SDK."
    echo "   Visit https://sdk.dfinity.org/docs/quickstart/local-quickstart.html"
    exit 1
fi

# Check if the local replica is already running
if dfx ping &> /dev/null
then
    echo "✅ Local replica already running"
else
    echo "🔄 Starting local Internet Computer replica..."
    dfx start --background
    
    # Wait for replica to start
    sleep 5
fi

# Build and deploy canisters
echo "🔄 Building and deploying canisters..."
dfx deploy

# Start frontend development server
echo "🔄 Starting frontend development server..."
cd frontend && npm run dev

echo "✅ Development environment is ready!"
