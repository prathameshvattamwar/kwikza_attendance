#!/bin/bash
# ============================================
# Attendance Management System — Quick Start
# ============================================
# Just double-click this file or run: bash start.sh

echo ""
echo "🚀 Starting Attendance Management System..."
echo "============================================"
echo ""

# Get the directory where this script lives
DIR="$(cd "$(dirname "$0")" && pwd)"

# Step 1: Install server dependencies (if needed)
echo "📦 Installing server dependencies..."
cd "$DIR/server"
npm install --silent 2>/dev/null

# Step 2: Install client dependencies (if needed)
echo "📦 Installing client dependencies..."
cd "$DIR/client"
npm install --silent 2>/dev/null

# Step 3: Start the backend server in background
echo "🖥️  Starting backend server on port 5001..."
cd "$DIR/server"
npx nodemon src/server.js &
SERVER_PID=$!

# Step 4: Start the frontend dev server
echo "🌐 Starting frontend on port 5173..."
cd "$DIR/client"
npx vite --host &
CLIENT_PID=$!

echo ""
echo "============================================"
echo "✅ Both servers are running!"
echo ""
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:5001"
echo "   Health:    http://localhost:5001/api/health"
echo ""
echo "   Press Ctrl+C to stop both servers"
echo "============================================"
echo ""

# Wait and handle Ctrl+C to kill both
trap "echo ''; echo 'Stopping servers...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit 0" INT TERM
wait
