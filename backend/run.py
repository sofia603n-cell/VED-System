#!/usr/bin/env python
import subprocess
import sys
import os

# Cambiar al directorio del backend
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Ejecutar uvicorn
subprocess.run([
    sys.executable, "-m", "uvicorn",
    "app.main:app",
    "--reload",
    "--host", "0.0.0.0",
    "--port", "8000"
])
