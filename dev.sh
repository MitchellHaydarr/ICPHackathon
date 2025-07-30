#!/usr/bin/env bash

# Make sure we're in the project directory
cd "$(dirname "$0")"

echo "Starting Internet Computer replica..."
dfx stop
dfx start --background

echo "Building and deploying canisters..."
dfx deploy

echo "Installing frontend dependencies..."
cd frontend
npm install

echo "Starting frontend development server..."
npm run dev
