"""
Secure File System Service

Security Policies:
1. Root Confinement: All paths must be within PROJECT_ROOT
2. Read-Only Default: Only read operations allowed for evaluation
3. Whitelist Extensions: Only allowed file types can be accessed
"""

import os
from pathlib import Path
from typing import Optional, List, Dict
from config import Config


class FileSecurityError(Exception):
    """Raised when a file operation violates security policies."""
    pass


class FileService:
    def __init__(self):
        self.project_root = Config.PROJECT_ROOT
        self.allowed_extensions = Config.ALLOWED_EXTENSIONS

    def _validate_path(self, file_path: str) -> Path:
        """
        Validate that the path is safe to access.

        Security checks:
        1. Path must resolve within PROJECT_ROOT (no ../ escapes)
        2. File extension must be in whitelist
        """
        try:
            # Strip leading slashes to treat as relative path
            clean_path = file_path.lstrip('/\\')

            # Always treat as relative to project root
            resolved = (self.project_root / clean_path).resolve()

            # Check 1: Root Confinement
            try:
                resolved.relative_to(self.project_root)
            except ValueError:
                raise FileSecurityError(
                    f"Access denied: Path '{file_path}' is outside project root"
                )

            # Check 2: Extension Whitelist
            if resolved.suffix.lower() not in self.allowed_extensions:
                raise FileSecurityError(
                    f"Access denied: Extension '{resolved.suffix}' is not allowed. "
                    f"Allowed: {self.allowed_extensions}"
                )

            return resolved

        except FileSecurityError:
            raise
        except Exception as e:
            raise FileSecurityError(f"Invalid path: {e}")

    def read_file(self, file_path: str) -> Optional[str]:
        """
        Safely read a file within the project root.

        Args:
            file_path: Relative or absolute path to the file

        Returns:
            File contents as string, or None if file doesn't exist

        Raises:
            FileSecurityError: If path violates security policies
        """
        validated_path = self._validate_path(file_path)

        if not validated_path.exists():
            return None

        if not validated_path.is_file():
            raise FileSecurityError(f"Not a file: {file_path}")

        return validated_path.read_text(encoding='utf-8')

    def read_multiple_files(self, file_paths: List[str]) -> Dict[str, Optional[str]]:
        """
        Read multiple files safely.

        Returns:
            Dict mapping file paths to their contents (or None if not found)
        """
        results = {}
        for path in file_paths:
            try:
                results[path] = self.read_file(path)
            except FileSecurityError as e:
                results[path] = f"[ERROR: {e}]"
        return results

    def list_files(self, directory: str = '', pattern: str = '*') -> List[str]:
        """
        List files in a directory within project root.

        Args:
            directory: Relative path to directory (default: project root)
            pattern: Glob pattern for filtering (default: all files)

        Returns:
            List of relative file paths
        """
        if directory:
            base_path = (self.project_root / directory).resolve()
        else:
            base_path = self.project_root

        # Security check
        try:
            base_path.relative_to(self.project_root)
        except ValueError:
            raise FileSecurityError("Directory is outside project root")

        if not base_path.exists():
            return []

        files = []
        for path in base_path.rglob(pattern):
            if path.is_file() and path.suffix.lower() in self.allowed_extensions:
                try:
                    rel_path = path.relative_to(self.project_root)
                    files.append(str(rel_path))
                except ValueError:
                    continue

        return sorted(files)

    def check_files_exist(self, file_paths: List[str]) -> Dict[str, bool]:
        """
        Check which files exist in the project root.

        Args:
            file_paths: List of relative file paths to check

        Returns:
            Dict mapping file paths to existence boolean
        """
        result = {}
        for fp in file_paths:
            try:
                clean_path = fp.lstrip('/\\')
                resolved = (self.project_root / clean_path).resolve()
                # Security: must be within project root
                resolved.relative_to(self.project_root)
                result[fp] = resolved.exists() and resolved.is_file()
            except (ValueError, Exception):
                result[fp] = False
        return result

    def write_artifact(self, filename: str, content: str) -> str:
        """
        Write an artifact file (MD documents only).

        This is the only write operation allowed, and only for .md files
        in the artifacts directory.

        Returns:
            Relative path to the written file
        """
        if not filename.endswith('.md'):
            raise FileSecurityError("Only .md files can be written as artifacts")

        artifacts_dir = self.project_root / Config.ARTIFACTS_DIR
        artifacts_dir.mkdir(parents=True, exist_ok=True)

        file_path = artifacts_dir / filename

        # Ensure we're still in project root
        try:
            file_path.resolve().relative_to(self.project_root)
        except ValueError:
            raise FileSecurityError("Invalid artifact path")

        file_path.write_text(content, encoding='utf-8')
        return str(file_path.relative_to(self.project_root))

    def read_artifact(self, filename: str) -> Optional[str]:
        """Read an artifact file from the artifacts directory."""
        artifact_path = f"{Config.ARTIFACTS_DIR}/{filename}"
        return self.read_file(artifact_path)

    def list_artifacts(self) -> List[str]:
        """List all artifact files."""
        return self.list_files(Config.ARTIFACTS_DIR, '*.md')


# Singleton instance
file_service = FileService()
