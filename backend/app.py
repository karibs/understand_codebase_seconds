"""
Architect - Project Analyzer Backend

Flask server providing API endpoints for project analysis.
"""

import io
import os
import zipfile
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from config import Config
from services.project_analyzer import project_analyzer

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)
cors_origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://karibs.github.io',
]
if os.getenv('CORS_ORIGIN'):
    cors_origins.append(os.getenv('CORS_ORIGIN'))
CORS(app, origins=cors_origins, supports_credentials=True)

# Add PNA (Private Network Access) header for all responses
@app.after_request
def add_pna_header(response):
    response.headers['Access-Control-Allow-Private-Network'] = 'true'
    return response


# =============================================================================
# API Routes
# =============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "project_root": str(Config.PROJECT_ROOT),
    })


@app.route('/api/config/project-root', methods=['GET'])
def get_project_root():
    """Get the current project root directory."""
    return jsonify({"project_root": str(Config.PROJECT_ROOT)})


@app.route('/api/config/project-root', methods=['POST'])
def set_project_root():
    """
    Set the project root directory.

    Request Body:
        { "path": "C:/Users/me/my-project" }

    Response:
        { "project_root": "C:/Users/me/my-project", "exists": true }
    """
    data = request.get_json()
    if not data or not data.get('path'):
        return jsonify({"error": "Missing 'path' in request body"}), 400

    new_root = data['path'].strip()
    if not new_root:
        return jsonify({"error": "Path cannot be empty"}), 400

    try:
        resolved = Path(new_root).resolve()
        Config.PROJECT_ROOT = resolved

        return jsonify({
            "project_root": str(resolved),
            "exists": resolved.exists()
        })
    except Exception as e:
        return jsonify({"error": f"Invalid path: {str(e)}"}), 400


@app.route('/api/project/browse', methods=['GET'])
def browse_folder():
    """Open a native OS folder picker dialog and return the selected path."""
    import threading

    result = {}

    def _pick():
        try:
            import tkinter as tk
            from tkinter import filedialog
            root = tk.Tk()
            root.withdraw()
            root.attributes('-topmost', True)
            folder = filedialog.askdirectory(title='Select Project Folder')
            root.destroy()
            result['path'] = folder or ''
        except Exception as e:
            result['error'] = str(e)

    # tkinter must run on a thread (Flask may not be on main thread)
    t = threading.Thread(target=_pick)
    t.start()
    t.join(timeout=120)

    if 'error' in result:
        return jsonify({"error": result['error']}), 500
    return jsonify({"path": result.get('path', '')})


@app.route('/api/project/analyze', methods=['POST'])
def analyze_project():
    """
    Analyze an existing project directory and generate workflow graph.

    Request Body:
        { "path": "C:/Users/me/my-project" }

    Response:
        {
            "framework": {...},
            "diagnostics": {...},
            "nodes": [...],
            "edges": [...],
            "api_flows": [...]
        }
    """
    data = request.get_json()
    path = data.get('path', str(Config.PROJECT_ROOT)) if data else str(Config.PROJECT_ROOT)

    if not path or not path.strip():
        return jsonify({"error": "Missing 'path' in request body"}), 400

    try:
        result = project_analyzer.analyze(path.strip())
        if "error" in result:
            return jsonify(result), 400
        return jsonify(result)
    except Exception as e:
        import traceback
        print(f"[analyze_project] Exception: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/project/read-file', methods=['POST'])
def read_file():
    """
    Read the content of a single file within a project directory.

    Request Body:
        { "path": "C:/project", "file": "src/App.vue" }

    Response:
        { "file": "src/App.vue", "content": "...", "lines": 42, "size": 1234 }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing request body"}), 400

    project_path = data.get('path', '').strip()
    file_rel = data.get('file', '').strip()
    if not project_path or not file_rel:
        return jsonify({"error": "Missing 'path' or 'file'"}), 400

    try:
        root = Path(project_path).resolve()
        target = (root / file_rel).resolve()
        # Prevent directory traversal
        if not str(target).startswith(str(root)):
            return jsonify({"error": "Invalid file path"}), 400
        if not target.is_file():
            return jsonify({"error": "File not found"}), 404

        size = target.stat().st_size
        MAX_SIZE = 200 * 1024  # 200KB
        if size > MAX_SIZE:
            return jsonify({
                "file": file_rel,
                "content": None,
                "lines": 0,
                "size": size,
                "error": f"File too large ({size:,} bytes). Max {MAX_SIZE:,} bytes."
            })

        content = target.read_text(encoding='utf-8', errors='ignore')
        line_count = content.count('\n') + (1 if content and not content.endswith('\n') else 0)

        return jsonify({
            "file": file_rel,
            "content": content,
            "lines": line_count,
            "size": size
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/project/download-zip', methods=['POST'])
def download_zip():
    """
    Package multiple project files into a ZIP and return it.

    Request Body:
        { "path": "C:/project", "files": ["src/a.py", "src/b.py"], "name": "backend" }

    Response:
        ZIP file download
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing request body"}), 400

    project_path = data.get('path', '').strip()
    files = data.get('files', [])
    zip_name = data.get('name', 'files') + '.zip'

    if not project_path or not files:
        return jsonify({"error": "Missing 'path' or 'files'"}), 400

    try:
        root = Path(project_path).resolve()
        buf = io.BytesIO()
        added = 0

        with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
            for file_rel in files:
                target = (root / file_rel).resolve()
                # Skip files outside project root
                if not str(target).startswith(str(root)):
                    continue
                if not target.is_file():
                    continue
                # Skip very large files (5MB)
                if target.stat().st_size > 5 * 1024 * 1024:
                    continue
                zf.write(target, file_rel)
                added += 1

        if added == 0:
            return jsonify({"error": "No valid files to package"}), 400

        buf.seek(0)
        return send_file(
            buf,
            mimetype='application/zip',
            as_attachment=True,
            download_name=zip_name
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/download-backend', methods=['GET'])
def download_backend():
    """
    Package the entire backend directory as a ZIP for download.
    Excludes __pycache__, .pyc, .env, venv/, .git directories.
    """
    backend_dir = Path(__file__).parent.resolve()
    exclude_dirs = {'__pycache__', 'venv', '.venv', '.git', 'node_modules'}
    exclude_exts = {'.pyc', '.pyo'}
    exclude_files = {'.env'}

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(backend_dir):
            # Filter out excluded directories in-place
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for fname in files:
                if fname in exclude_files:
                    continue
                if Path(fname).suffix in exclude_exts:
                    continue
                full_path = Path(root) / fname
                arc_name = full_path.relative_to(backend_dir)
                # Skip very large files (5MB)
                if full_path.stat().st_size > 5 * 1024 * 1024:
                    continue
                zf.write(full_path, str(arc_name))

    buf.seek(0)
    return send_file(
        buf,
        mimetype='application/zip',
        as_attachment=True,
        download_name='architect-backend.zip'
    )


@app.route('/api/project/search', methods=['POST'])
def search_project():
    """
    Search for a keyword inside project source files.

    Request Body:
        { "path": "C:/project", "query": "useState" }

    Response:
        {
            "query": "useState",
            "total_files": 3,
            "results": [
                {"file": "src/App.vue", "count": 4, "matches": [{"line": 5, "content": "..."}]}
            ]
        }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing request body"}), 400

    query = (data.get('query') or '').strip()
    if len(query) < 2:
        return jsonify({"error": "Query must be at least 2 characters"}), 400

    path = data.get('path', str(Config.PROJECT_ROOT)).strip()
    if not path:
        return jsonify({"error": "Missing 'path'"}), 400

    try:
        result = project_analyzer.search_in_files(path, query)
        if "error" in result:
            return jsonify(result), 400
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =============================================================================
# Error Handlers
# =============================================================================

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


# =============================================================================
# Main
# =============================================================================

if __name__ == '__main__':
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║           Architect - Project Analyzer                      ║
╠══════════════════════════════════════════════════════════════╣
║  Server:       http://localhost:5000                        ║
╚══════════════════════════════════════════════════════════════╝
    """)
    app.run(host='0.0.0.0', port=5000, debug=Config.DEBUG)
