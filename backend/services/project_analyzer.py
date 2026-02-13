"""
Project Analyzer - Offline Project Analysis & Mapping

Scans a local project directory and generates a DAG (Directed Acyclic Graph)
of nodes and typed edges compatible with Vue Flow.

Classification: Hybrid (Directory Path primary, File Extension secondary)
Edge Types: import, state_usage, api_call
"""

import os
import re
import json
from pathlib import Path

# =============================================================================
# 1. File Discovery & Filtering (Scope)
# =============================================================================

SKIP_DIRS = {
    'node_modules', '.git', 'dist', 'build', '__pycache__',
    '.venv', 'venv', 'env', '.next', '.nuxt', '.svelte-kit',
    '.idea', '.vscode', 'coverage', '.cache', '.output',
    'doc', 'docs', 'logs', 'log', 'tmp', 'temp',
}

SKIP_EXTENSIONS = {
    '.pyc', '.pyo', '.map', '.lock', '.ico', '.png', '.jpg',
    '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot',
    '.pem', '.log', '.txt', '.md', '.yaml', '.yml',
    '.toml', '.cfg', '.ini', '.env', '.gitignore',
}

# Target extensions per spec
CODE_EXTENSIONS = {
    '.vue', '.js', '.jsx', '.ts', '.tsx', '.svelte',
    '.py', '.rb', '.go', '.java', '.rs',
    '.html', '.css', '.scss', '.less',
    '.json',
}

# Skip minified, bundled, and config files
VENDOR_PATTERNS = re.compile(
    r'(?:'
    r'[\.\-]min\.js$|[\.\-]min\.css$'
    r'|[\.\-]bundle\.js$'
    r'|^\.eslintrc|^webpack\.config|^vite\.config'
    r'|^rollup\.config|^babel\.config|^tsconfig|^jest\.config'
    r')',
    re.IGNORECASE
)

# =============================================================================
# 2. Classification Criteria (Node Typing) — Hybrid: Directory + Extension
# =============================================================================

# Primary criteria: directory path → layer
DIR_TYPE_MAP = {
    # Publishing (UI)
    'views': 'publishing', 'pages': 'publishing',
    'components': 'publishing', 'component': 'publishing',
    'layouts': 'publishing', 'layout': 'publishing',
    'templates': 'publishing', 'template': 'publishing',
    # Logic (State)
    'stores': 'logic', 'store': 'logic',
    'composables': 'logic', 'hooks': 'logic',
    'services': 'logic', 'service': 'logic',
    # Backend (API)
    'api': 'backend',
    'routes': 'backend', 'route': 'backend',
    'server': 'backend',
    'controllers': 'backend', 'controller': 'backend',
    'routers': 'backend', 'router': 'backend',
    'blueprints': 'backend', 'blueprint': 'backend',
}

# Secondary criteria: file extension → layer (fallback)
EXT_TYPE_MAP = {
    '.vue': 'publishing', '.jsx': 'publishing', '.tsx': 'publishing',
    '.html': 'publishing',
    '.css': 'publishing', '.scss': 'publishing', '.less': 'publishing',
    '.svelte': 'publishing',
    '.js': 'logic', '.ts': 'logic',
    '.py': 'backend', '.rb': 'backend', '.go': 'backend',
    '.java': 'backend', '.rs': 'backend',
}

# Files to always skip (boilerplate, not meaningful nodes)
SKIP_FILES = {'__init__.py', '__pycache__', 'setup.py', 'conftest.py'}


# =============================================================================
# Analyzer
# =============================================================================

class ProjectAnalyzer:
    def search_in_files(self, project_path: str, query: str) -> dict:
        """Search for a keyword inside all code files of a project."""
        root = Path(project_path).resolve()
        if not root.exists() or not root.is_dir():
            return {"error": f"Directory not found: {project_path}"}

        files = self._scan_files(root)
        query_lower = query.lower()
        results = []

        for fpath in files:
            try:
                content = fpath.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue

            rel = str(fpath.relative_to(root)).replace("\\", "/")
            matches = []
            for i, line in enumerate(content.splitlines(), 1):
                if query_lower in line.lower():
                    matches.append({
                        "line": i,
                        "content": line.strip()[:120],
                    })
            if matches:
                results.append({
                    "file": rel,
                    "count": len(matches),
                    "matches": matches[:5],
                })

        results.sort(key=lambda r: r["count"], reverse=True)
        return {"query": query, "results": results, "total_files": len(results)}

    def analyze(self, project_path: str) -> dict:
        root = Path(project_path).resolve()
        if not root.exists() or not root.is_dir():
            return {"error": f"Directory not found: {project_path}"}

        framework = self._detect_framework(root)
        files = self._scan_files(root)
        buckets = self._categorize_files(root, files)
        edge_list, api_endpoints = self._extract_edges(root, files)
        diagnostics = self._build_diagnostics(framework, files, buckets)
        nodes, edges = self._generate_graph(root, buckets, edge_list, api_endpoints)

        # Build organized API flow summary
        api_flows = []
        for (src, tgt), endpoints in api_endpoints.items():
            api_flows.append({
                "source": src,
                "target": tgt,
                "endpoints": sorted(endpoints),
                "count": len(endpoints),
            })
        api_flows.sort(key=lambda f: f["count"], reverse=True)

        return {
            "framework": framework,
            "diagnostics": diagnostics,
            "nodes": nodes,
            "edges": edges,
            "api_flows": api_flows,
        }

    # -----------------------------------------------------------------
    # Framework detection
    # -----------------------------------------------------------------
    def _detect_framework(self, root: Path) -> dict:
        result = {"frontend": None, "backend": None, "languages": []}

        # Check package.json (root + one level deep)
        pkg_candidates = [root / "package.json"]
        for sub in root.iterdir():
            if sub.is_dir() and sub.name not in SKIP_DIRS and not sub.name.startswith('.'):
                candidate = sub / "package.json"
                if candidate.exists():
                    pkg_candidates.append(candidate)

        for pkg_path in pkg_candidates:
            if not pkg_path.exists():
                continue
            try:
                pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
                deps = {}
                deps.update(pkg.get("dependencies", {}))
                deps.update(pkg.get("devDependencies", {}))

                if not result["frontend"]:
                    if "vue" in deps or "@vue/cli-service" in deps:
                        result["frontend"] = "Vue"
                    elif "react" in deps or "react-dom" in deps:
                        result["frontend"] = "React"
                    elif "svelte" in deps:
                        result["frontend"] = "Svelte"
                    elif "next" in deps:
                        result["frontend"] = "Next.js"
                    elif "@angular/core" in deps:
                        result["frontend"] = "Angular"

                if "typescript" in deps and "TypeScript" not in result["languages"]:
                    result["languages"].append("TypeScript")
                if "JavaScript" not in result["languages"]:
                    result["languages"].append("JavaScript")

                # Express / NestJS backend detection from JS deps
                if not result["backend"]:
                    if "express" in deps:
                        result["backend"] = "Express"
                    elif "@nestjs/core" in deps:
                        result["backend"] = "NestJS"
            except Exception:
                pass

        # Check Python backend (root + one level deep)
        req_candidates = []
        for base in [root] + [d for d in root.iterdir()
                               if d.is_dir() and d.name not in SKIP_DIRS and not d.name.startswith('.')]:
            if (base / "requirements.txt").exists():
                req_candidates.append(base / "requirements.txt")
            if (base / "pyproject.toml").exists():
                req_candidates.append(base / "pyproject.toml")

        has_py_files = any(root.glob("*.py")) or any(root.glob("**/*.py"))
        has_python = bool(req_candidates) or has_py_files

        if has_python:
            if "Python" not in result["languages"]:
                result["languages"].append("Python")

            reqs_text = ""
            try:
                for rp in req_candidates:
                    reqs_text += rp.read_text(encoding="utf-8", errors="ignore").lower()
            except Exception:
                pass

            py_imports = ""
            try:
                for py_file in list(root.glob("*.py"))[:5]:
                    py_imports += py_file.read_text(encoding="utf-8", errors="ignore").lower()
            except Exception:
                pass

            combined = reqs_text + py_imports
            if not result["backend"]:
                if "flask" in combined:
                    result["backend"] = "Flask"
                elif "fastapi" in combined:
                    result["backend"] = "FastAPI"
                elif "django" in combined:
                    result["backend"] = "Django"

            if (root / "templates").is_dir() and not result["frontend"]:
                result["frontend"] = "Jinja2"

        result["languages"] = list(dict.fromkeys(result["languages"]))
        return result

    # -----------------------------------------------------------------
    # 1. File Discovery
    # -----------------------------------------------------------------
    @staticmethod
    def _is_data_dir(name: str) -> bool:
        return bool(re.match(r'^\d{4}[_\-]\d{2}$', name))

    def _scan_files(self, root: Path) -> list:
        collected = []
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [
                d for d in dirnames
                if d not in SKIP_DIRS
                and not d.startswith('.')
                and not self._is_data_dir(d)
            ]
            for fname in filenames:
                fpath = Path(dirpath) / fname
                ext = fpath.suffix.lower()
                if ext in SKIP_EXTENSIONS:
                    continue
                if ext not in CODE_EXTENSIONS:
                    continue
                if VENDOR_PATTERNS.search(fname):
                    continue
                collected.append(fpath)
        return collected

    # -----------------------------------------------------------------
    # 2. Hybrid Classification (Directory primary, Extension secondary)
    # -----------------------------------------------------------------
    def _categorize_files(self, root: Path, files: list) -> dict:
        buckets = {
            "publishing": [],
            "logic": [],
            "backend": [],
            "other": [],
        }

        for fpath in files:
            fname_lower = fpath.name.lower()
            if fname_lower in SKIP_FILES:
                buckets["other"].append(fpath)
                continue

            rel = fpath.relative_to(root)
            parts = rel.parts
            ext = fpath.suffix.lower()

            # Primary: check directory parts (deepest match wins)
            dir_type = None
            for part in reversed(parts[:-1]):
                lower = part.lower()
                if lower in DIR_TYPE_MAP:
                    dir_type = DIR_TYPE_MAP[lower]
                    break

            if dir_type:
                buckets[dir_type].append(fpath)
                continue

            # Backend detection via route decorators (.py files)
            if ext == '.py':
                try:
                    content = fpath.read_text(encoding="utf-8", errors="ignore")
                    if re.search(r'@\w+\.(route|get|post|put|delete|patch)\s*\(', content):
                        buckets["backend"].append(fpath)
                        continue
                except Exception:
                    pass

            # Secondary: extension-based fallback
            ext_type = EXT_TYPE_MAP.get(ext)
            if ext_type:
                buckets[ext_type].append(fpath)
            else:
                buckets["other"].append(fpath)

        return buckets

    # -----------------------------------------------------------------
    # 3. Dependency Mapping (Typed Edge Extraction)
    # -----------------------------------------------------------------
    def _extract_edges(self, root: Path, files: list) -> tuple:
        """
        Returns (edge_list, api_endpoints) where:
        - edge_list: [(source_rel, target_rel, edge_type), ...]
        - api_endpoints: {(source_rel, target_rel): [endpoint_url, ...]}
        """
        edges = []
        api_endpoints = {}  # (src_rel, tgt_rel) -> [endpoint_url, ...]

        # Build lookups
        all_rel_paths = set()
        for f in files:
            all_rel_paths.add(str(f.relative_to(root)).replace("\\", "/"))

        # Python module -> file mapping
        py_module_map = {}
        for f in files:
            if f.suffix.lower() == '.py':
                rel = str(f.relative_to(root)).replace("\\", "/")
                mod_name = rel.replace("/", ".").removesuffix(".py")
                if mod_name.endswith(".__init__"):
                    mod_name = mod_name.removesuffix(".__init__")
                py_module_map[mod_name] = rel
                short = mod_name.rsplit(".", 1)[-1]
                if short not in py_module_map:
                    py_module_map[short] = rel

        # Collect backend route definitions for endpoint-to-service mapping
        # { "/api/users" -> "controller/Rest.py" }
        route_map = {}
        route_def_re = re.compile(
            r'''@(\w+)\.(?:route|get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]'''
        )
        # First pass: build per-file Blueprint url_prefix map
        # { rel_path: { var_name: prefix } }
        # Handles both:  Blueprint(..., url_prefix='/rest')   (in constructor)
        #           and:  register_blueprint(var, url_prefix='/rest')  (at registration)
        bp_prefix_map = {}
        bp_var_to_file = {}  # { var_name: rel_path } — blueprint var → defining file
        bp_def_re = re.compile(
            r'''(\w+)\s*=\s*Blueprint\s*\('''
        )
        bp_def_with_prefix_re = re.compile(
            r'''(\w+)\s*=\s*Blueprint\s*\([^)]*?url_prefix\s*=\s*['"]([^'"]+)['"]''',
            re.DOTALL
        )
        bp_register_re = re.compile(
            r'''\.register_blueprint\s*\(\s*(\w+)[^)]*?url_prefix\s*=\s*['"]([^'"]+)['"]''',
            re.DOTALL
        )
        bp_registrations = []  # [(var_name, prefix), ...]
        for f in files:
            if f.suffix.lower() == '.py':
                try:
                    content = f.read_text(encoding="utf-8", errors="ignore")
                except Exception:
                    continue
                rel = str(f.relative_to(root)).replace("\\", "/")
                # Track Blueprint() definitions
                for m in bp_def_re.finditer(content):
                    bp_var_to_file[m.group(1)] = rel
                # url_prefix in constructor
                for m in bp_def_with_prefix_re.finditer(content):
                    bp_prefix_map.setdefault(rel, {})[m.group(1)] = m.group(2)
                # register_blueprint(var, url_prefix='...')
                for m in bp_register_re.finditer(content):
                    bp_registrations.append((m.group(1), m.group(2)))
        # Merge register_blueprint prefixes → file that defines the blueprint var
        for var_name, prefix in bp_registrations:
            bp_file = bp_var_to_file.get(var_name)
            if bp_file and var_name not in bp_prefix_map.get(bp_file, {}):
                bp_prefix_map.setdefault(bp_file, {})[var_name] = prefix

        for f in files:
            if f.suffix.lower() in ('.py', '.js', '.ts'):
                try:
                    content = f.read_text(encoding="utf-8", errors="ignore")
                except Exception:
                    continue
                rel = str(f.relative_to(root)).replace("\\", "/")
                file_bp_prefixes = bp_prefix_map.get(rel, {})
                for m in route_def_re.finditer(content):
                    var_name = m.group(1)
                    route_path = m.group(2)
                    prefix = file_bp_prefixes.get(var_name, '')
                    if prefix:
                        full_path = prefix.rstrip('/') + '/' + route_path.lstrip('/')
                        route_map[full_path] = rel
                    # Also store raw route_path as fallback
                    if route_path not in route_map:
                        route_map[route_path] = rel
                # Also catch Express-style: router.get('/api/...', ...)
                for m in re.finditer(r'''(?:router|app)\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]''', content):
                    route_path = m.group(2)
                    route_map[route_path] = rel

        # Regexes
        js_import_re = re.compile(
            r'''(?:import\s+.*?\s+from\s+|import\s*\()\s*['"]([^'"]+)['"]'''
        )
        js_require_re = re.compile(
            r'''require\s*\(\s*['"]([^'"]+)['"]'''
        )
        py_import_re = re.compile(
            r'''(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))'''
        )
        render_template_re = re.compile(
            r'''render_template\s*\(\s*['"]([^'"]+)['"]'''
        )
        url_for_re = re.compile(
            r'''url_for\s*\(\s*['"]([^'"]+)['"]'''
        )
        # B. Framework-specific: useStore / defineStore patterns
        use_store_re = re.compile(
            r'''use\w*Store\s*\('''
        )
        store_import_re = re.compile(
            r'''import\s+\{[^}]*\}\s+from\s+['"]([^'"]*store[^'"]*?)['"]'''
        )
        # C. API call strings in frontend: fetch('/rest/getdata'), axios.get('/api/users')
        api_call_re = re.compile(
            r'''(?:fetch|axios\.?\w*|\$http\.?\w*)\s*\(\s*[`'"]([^`'"]*\/[a-zA-Z][^`'"]*)[`'"]'''
        )
        # Also match template literals and string concatenation with /api/
        api_url_re = re.compile(
            r'''['"`]/(?:api|rest)/[^'"`]+['"`]'''
        )

        for fpath in files:
            ext = fpath.suffix.lower()
            try:
                content = fpath.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue

            rel_source = str(fpath.relative_to(root)).replace("\\", "/")

            # === A. Static Import Tracing ===
            if ext in ('.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'):
                # ES import
                for m in js_import_re.finditer(content):
                    imp = m.group(1)
                    resolved = self._resolve_js_import(fpath, imp, root, all_rel_paths)
                    if resolved:
                        edges.append((rel_source, resolved, 'import'))
                # CommonJS require
                for m in js_require_re.finditer(content):
                    imp = m.group(1)
                    if imp.startswith('.'):
                        resolved = self._resolve_js_import(fpath, imp, root, all_rel_paths)
                        if resolved:
                            edges.append((rel_source, resolved, 'import'))

                # === B. State usage (useStore) ===
                if use_store_re.search(content):
                    for m in store_import_re.finditer(content):
                        imp = m.group(1)
                        resolved = self._resolve_js_import(fpath, imp, root, all_rel_paths)
                        if resolved:
                            edges.append((rel_source, resolved, 'state_usage'))

                # === C. API call detection ===
                for m in api_call_re.finditer(content):
                    api_path = m.group(1)
                    # Try to match with known backend routes
                    target = self._match_api_route(api_path, route_map)
                    if target:
                        edges.append((rel_source, target, 'api_call'))
                        key = (rel_source, target)
                        # Normalize for display: strip ${...} prefix, keep path params as *
                        clean = re.sub(r'^\$\{[^}]*\}', '', api_path)
                        clean = re.sub(r'\$\{[^}]*\}', '*', clean)
                        ep_list = api_endpoints.setdefault(key, [])
                        if clean not in ep_list:
                            ep_list.append(clean)

                # === D. Route-map reverse lookup (catches gf_ReqComm, $.ajax, etc.) ===
                for route_path, route_target in route_map.items():
                    if route_target == rel_source:
                        continue
                    # Skip very short routes (e.g. '/') — too many false positives
                    if len(route_path) < 4:
                        continue
                    # Quick substring check, then verify it's inside a string literal
                    if route_path in content and re.search(
                        r'''['"`]''' + re.escape(route_path) + r'''[?'"`]''',
                        content,
                    ):
                        edges.append((rel_source, route_target, 'api_call'))
                        key = (rel_source, route_target)
                        ep_list = api_endpoints.setdefault(key, [])
                        if route_path not in ep_list:
                            ep_list.append(route_path)

            elif ext == '.py':
                # A. Python imports
                for m in py_import_re.finditer(content):
                    mod = m.group(1) or m.group(2)
                    if mod:
                        resolved = self._resolve_py_import(mod, py_module_map)
                        if resolved:
                            edges.append((rel_source, resolved, 'import'))

                # render_template → template file
                for m in render_template_re.finditer(content):
                    tpl = m.group(1)
                    tpl_rel = f"templates/{tpl}"
                    if tpl_rel in all_rel_paths:
                        edges.append((rel_source, tpl_rel, 'import'))

                # url_for → blueprint file
                for m in url_for_re.finditer(content):
                    endpoint = m.group(1)
                    bp_name = endpoint.split('.')[0]
                    resolved = self._resolve_py_import(bp_name, py_module_map)
                    if resolved:
                        edges.append((rel_source, resolved, 'import'))

            elif ext == '.html':
                # Jinja2: {% extends %}, {% include %}
                for m in re.finditer(r'''{%\s*(?:extends|include)\s+['"]([^'"]+)['"]''', content):
                    ref = m.group(1)
                    ref_rel = f"templates/{ref}" if not ref.startswith("templates/") else ref
                    if ref_rel in all_rel_paths:
                        edges.append((rel_source, ref_rel, 'import'))

                # <script src="...">
                for m in re.finditer(r'''<script[^>]+src=["']([^"']+)["']''', content):
                    resolved = self._resolve_static_ref(m.group(1), all_rel_paths)
                    if resolved:
                        edges.append((rel_source, resolved, 'import'))

                # <link href="...">
                for m in re.finditer(r'''<link[^>]+href=["']([^"']+)["']''', content):
                    resolved = self._resolve_static_ref(m.group(1), all_rel_paths)
                    if resolved:
                        edges.append((rel_source, resolved, 'import'))

                # Jinja2: url_for('blueprint.func')
                for m in url_for_re.finditer(content):
                    endpoint = m.group(1)
                    if endpoint == 'static':
                        continue
                    bp_name = endpoint.split('.')[0]
                    resolved = self._resolve_py_import(bp_name, py_module_map)
                    if resolved:
                        edges.append((rel_source, resolved, 'api_call'))

        # Deduplicate: same source→target keeps highest-priority type
        TYPE_PRIORITY = {'api_call': 0, 'state_usage': 1, 'import': 2}
        seen = {}
        for src, tgt, etype in edges:
            if src == tgt:
                continue
            key = (src, tgt)
            if key not in seen or TYPE_PRIORITY.get(etype, 9) < TYPE_PRIORITY.get(seen[key], 9):
                seen[key] = etype

        return [(s, t, et) for (s, t), et in seen.items()], api_endpoints

    # -----------------------------------------------------------------
    # Path resolution helpers
    # -----------------------------------------------------------------
    def _resolve_js_import(self, source: Path, imp: str, root: Path, all_rel_paths: set) -> str | None:
        # Handle @/ alias → src/
        if imp.startswith('@/'):
            imp = 'src/' + imp[2:]
            candidate = (root / imp).resolve()
        elif imp.startswith('.'):
            candidate = (source.parent / imp).resolve()
        else:
            return None  # bare module (node_modules)

        extensions = ['', '.js', '.ts', '.jsx', '.tsx', '.vue',
                      '/index.js', '/index.ts', '/index.vue']
        for ext in extensions:
            test = Path(str(candidate) + ext)
            if test.exists() and test.is_file():
                try:
                    rel = str(test.relative_to(root)).replace("\\", "/")
                    if rel in all_rel_paths:
                        return rel
                except ValueError:
                    pass
        return None

    @staticmethod
    def _resolve_static_ref(url: str, all_rel_paths: set) -> str | None:
        if url.startswith(('http://', 'https://', '//')):
            return None
        rel = url.lstrip('/')
        if rel in all_rel_paths:
            return rel
        if not rel.startswith('static/') and f"static/{rel}" in all_rel_paths:
            return f"static/{rel}"
        return None

    def _resolve_py_import(self, module_name: str, py_module_map: dict) -> str | None:
        if module_name in py_module_map:
            return py_module_map[module_name]
        parts = module_name.split(".")
        for i in range(len(parts)):
            partial = ".".join(parts[i:])
            if partial in py_module_map:
                return py_module_map[partial]
        return None

    @staticmethod
    def _match_api_route(api_path: str, route_map: dict) -> str | None:
        """Match a frontend API call to a backend route definition."""
        # Strip variable prefixes: ${BASE_URL}/api/... → /api/...
        normalized = re.sub(r'^\$\{[^}]*\}', '', api_path)
        # Exact match
        if normalized in route_map:
            return route_map[normalized]
        # Strip query params and trailing slash
        clean = normalized.split('?')[0].rstrip('/')
        if clean in route_map:
            return route_map[clean]
        # Param match (e.g. '/api/users/123' matches '/api/users/<id>')
        for route_pattern, target in route_map.items():
            # Convert Flask route params to regex: <param> -> [^/]+
            regex_pattern = re.sub(r'<[^>]+>', '[^/]+', route_pattern)
            if re.fullmatch(regex_pattern, clean):
                return target
        # Suffix match: '/rest/getdata' ends with route '/getdata'
        for route_pattern, target in route_map.items():
            if route_pattern.startswith('/') and clean.endswith(route_pattern):
                return target
        return None

    # -----------------------------------------------------------------
    # 4. Data Representation (Graph Metadata)
    # -----------------------------------------------------------------
    def _build_diagnostics(self, framework: dict, files: list, buckets: dict) -> dict:
        return {
            "total_files": len(files),
            "page_count": len(buckets["publishing"]),
            "component_count": len(buckets["publishing"]),
            "logic_count": len(buckets["logic"]),
            "backend_count": len(buckets["backend"]),
            "other_count": len(buckets["other"]),
            "frontend_framework": framework.get("frontend"),
            "backend_framework": framework.get("backend"),
            "languages": framework.get("languages", []),
        }

    # Layout constants
    COL_X = {"publishing": 0, "logic": 600, "backend": 1200}
    GROUP_W = 240
    GROUP_PAD_X = 20
    GROUP_PAD_TOP = 40
    GROUP_PAD_BOTTOM = 20
    NODE_H = 80
    NODE_GAP = 16
    GROUP_GAP = 40

    @staticmethod
    def _center_out(items):
        """Place highest-priority item at center, rest alternate above/below.
        [A,B,C,D,E] sorted desc -> [D,B,A,C,E] with A in center."""
        if len(items) <= 1:
            return list(items)
        above, center, below = [], [], []
        for i, item in enumerate(items):
            if i == 0:
                center = [item]
            elif i % 2 == 1:
                above.insert(0, item)
            else:
                below.append(item)
        return above + center + below

    def _generate_graph(self, root: Path, buckets: dict, edge_list: list,
                        api_endpoints: dict = None) -> tuple:
        nodes = []
        graph_edges = []
        node_id_map = {}  # rel_path -> node_id

        # Step 1 — Group files by parent directory within each bucket
        column_groups = {}  # bucket_type -> {dir_key -> [fpath, ...]}
        for bucket_type in ("publishing", "logic", "backend"):
            groups = {}
            for fpath in buckets[bucket_type]:
                rel = fpath.relative_to(root)
                parent = str(rel.parent).replace("\\", "/")
                dir_key = parent if parent != "." else "(root)"
                groups.setdefault(dir_key, []).append(fpath)
            column_groups[bucket_type] = groups

        # Step 2 — Compute degree per file node from edge_list
        degree = {}
        for src, tgt, _ in edge_list:
            degree[src] = degree.get(src, 0) + 1
            degree[tgt] = degree.get(tgt, 0) + 1

        # Step 3 — Sort nodes within each group by degree (descending)
        for bucket_type, groups in column_groups.items():
            for dir_key, fpaths in groups.items():
                fpaths.sort(
                    key=lambda f: degree.get(
                        str(f.relative_to(root)).replace("\\", "/"), 0
                    ),
                    reverse=True,
                )

        # Step 4 — Sort groups within column using center-out placement
        sorted_columns = {}  # bucket_type -> [(dir_key, [fpaths])]
        for bucket_type, groups in column_groups.items():
            group_list = list(groups.items())
            # Total degree per group
            group_list.sort(
                key=lambda item: sum(
                    degree.get(str(f.relative_to(root)).replace("\\", "/"), 0)
                    for f in item[1]
                ),
                reverse=True,
            )
            sorted_columns[bucket_type] = self._center_out(group_list)

        # Step 5 — Generate group + file nodes with coordinates
        node_counter = 0
        group_counter = 0
        col_heights = {}  # bucket_type -> total column height

        for bucket_type in ("publishing", "logic", "backend"):
            col_x = self.COL_X[bucket_type]
            y_cursor = 0
            group_items = sorted_columns.get(bucket_type, [])

            for dir_key, fpaths in group_items:
                n = len(fpaths)
                group_h = (
                    self.GROUP_PAD_TOP
                    + n * self.NODE_H
                    + max(0, n - 1) * self.NODE_GAP
                    + self.GROUP_PAD_BOTTOM
                )

                group_id = f"grp-{bucket_type}-{group_counter:02d}"
                group_counter += 1

                # Group node (must appear before children)
                label = dir_key.split("/")[-1] if dir_key != "(root)" else "(root)"
                nodes.append({
                    "id": group_id,
                    "type": "directory",
                    "position": {"x": col_x, "y": y_cursor},
                    "data": {"label": label, "fileCount": n},
                    "style": {
                        "width": f"{self.GROUP_W}px",
                        "height": f"{group_h}px",
                    },
                    "selectable": False,
                })

                # Child file nodes (position relative to parent group)
                for i, fpath in enumerate(fpaths):
                    rel = str(fpath.relative_to(root)).replace("\\", "/")
                    node_id = f"node-{bucket_type}-{node_counter:02d}"
                    node_counter += 1
                    node_id_map[rel] = node_id

                    child_y = self.GROUP_PAD_TOP + i * (self.NODE_H + self.NODE_GAP)

                    nodes.append({
                        "id": node_id,
                        "type": bucket_type,
                        "parentNode": group_id,
                        "expandParent": True,
                        "position": {"x": self.GROUP_PAD_X, "y": child_y},
                        "data": {
                            "label": fpath.name,
                            "status": "completed",
                            "description": dir_key if dir_key != "(root)" else "",
                            "target_files": [rel],
                        },
                    })

                y_cursor += group_h + self.GROUP_GAP

            # Record total column height (remove trailing gap)
            col_heights[bucket_type] = max(0, y_cursor - self.GROUP_GAP) if group_items else 0

        # Step 6 — Vertical centering across columns
        max_h = max(col_heights.values()) if col_heights else 0
        for node in nodes:
            if node["type"] == "directory":
                # Determine which bucket this group belongs to
                for bucket_type in ("publishing", "logic", "backend"):
                    if node["position"]["x"] == self.COL_X[bucket_type]:
                        offset = (max_h - col_heights[bucket_type]) / 2
                        node["position"]["y"] += offset
                        break

        # Build typed edges (file-to-file only)
        api_ep = api_endpoints or {}
        for source_rel, target_rel, edge_type in edge_list:
            source_node = node_id_map.get(source_rel)
            target_node = node_id_map.get(target_rel)
            if source_node and target_node and source_node != target_node:
                edge = {
                    "id": f"e-{source_node}-{target_node}",
                    "source": source_node,
                    "target": target_node,
                    "type": edge_type,
                    "animated": edge_type == 'api_call',
                }
                # Add endpoint info to api_call edges
                if edge_type == 'api_call':
                    endpoints = api_ep.get((source_rel, target_rel), [])
                    if endpoints:
                        # Short label: strip /api/ prefix for brevity
                        short = [ep.replace('/api/', '', 1) for ep in endpoints]
                        if len(short) <= 2:
                            edge["label"] = ", ".join(short)
                        else:
                            edge["label"] = f"{short[0]}, {short[1]} (+{len(short) - 2})"
                        edge["data"] = {"endpoints": endpoints}
                graph_edges.append(edge)

        return nodes, graph_edges


project_analyzer = ProjectAnalyzer()
