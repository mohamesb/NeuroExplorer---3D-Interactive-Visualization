#!/usr/bin/env bash
set -e

echo "============================================================"
echo "  NeuroViz — Full Project Setup"
echo "============================================================"

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# ---------------------------------------------------------------------------
# 1. Python Backend
# ---------------------------------------------------------------------------
echo ""
echo "[1/4] Setting up Python backend..."

if ! command -v python &> /dev/null; then
    echo "ERROR: python not found. Please install Python 3.10+."
    exit 1
fi

cd "$PROJECT_DIR/backend"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "  Creating virtual environment..."
    python -m venv venv
fi

echo "  Activating virtual environment..."
source venv/bin/activate

echo "  Installing Python dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo "  Python backend ready."

# ---------------------------------------------------------------------------
# 2. Download Brain Data
# ---------------------------------------------------------------------------
echo ""
echo "[2/4] Downloading brain data..."
cd "$PROJECT_DIR"

python scripts/download_data.py || {
    echo "  WARNING: Data download had issues. The app will use simulated data."
}

# ---------------------------------------------------------------------------
# 3. Generate Brain Mesh
# ---------------------------------------------------------------------------
echo ""
echo "[3/4] Generating brain 3D mesh..."
python scripts/generate_meshes.py || {
    echo "  WARNING: Mesh generation had issues. Will generate on first request."
}

deactivate 2>/dev/null || true

# ---------------------------------------------------------------------------
# 4. Frontend
# ---------------------------------------------------------------------------
echo ""
echo "[4/4] Setting up React frontend..."

if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js 18+."
    exit 1
fi

cd "$PROJECT_DIR/frontend"
echo "  Installing Node dependencies..."
npm install --silent

echo ""
echo "============================================================"
echo "  Setup Complete!"
echo "============================================================"
echo ""
echo "  To start the application:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd $PROJECT_DIR/backend"
echo "    source venv/bin/activate"
echo "    uvicorn main:app --reload --port 8000"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd $PROJECT_DIR/frontend"
echo "    npm run dev"
echo ""
echo "  Then open: http://localhost:5173"
echo ""
echo "============================================================"
