#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
VENV_DIR="$BACKEND_DIR/venv"
BACKEND_PORT=8001
FRONTEND_PORT=3000

# Fix proxy: localhost should not go through proxy
export no_proxy="${no_proxy:+${no_proxy},}localhost,127.0.0.1,::1"
export NO_PROXY="${NO_PROXY:+${NO_PROXY},}localhost,127.0.0.1,::1"

cleanup() {
    echo ""
    echo "Shutting down..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null && echo "  Backend stopped (PID: $BACKEND_PID)"
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null && echo "  Frontend stopped (PID: $FRONTEND_PID)"
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# --- Backend setup ---
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
    "$VENV_DIR/bin/pip" install -q -r "$BACKEND_DIR/requirements.txt"
fi

echo "Starting backend on port $BACKEND_PORT..."
cd "$BACKEND_DIR"
"$VENV_DIR/bin/python" -m uvicorn app.main:app --reload --port "$BACKEND_PORT" --host 0.0.0.0 &
BACKEND_PID=$!

# --- Frontend setup ---
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install --silent
fi

echo "Starting frontend on port $FRONTEND_PORT..."
cd "$FRONTEND_DIR"
npx vite --port "$FRONTEND_PORT" --host &
FRONTEND_PID=$!

echo ""
echo "============================================"
echo "  X-Portals dev server started!"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo "  Backend:  http://localhost:$BACKEND_PORT"
echo "  API docs: http://localhost:$BACKEND_PORT/docs"
echo "  Press Ctrl+C to stop"
echo "============================================"
echo ""

wait
