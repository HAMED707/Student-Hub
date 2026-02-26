# scripts/update_requirements.py
from __future__ import annotations

import re
import subprocess
from pathlib import Path
import sys
try:
    from importlib.metadata import version as pkg_version  # py3.8+
except Exception:  # pragma: no cover
    from importlib_metadata import version as pkg_version  # type: ignore

ROOT = Path(__file__).resolve().parents[1]
REQ_FILE = ROOT / "requirements.txt"

# Map common import/package naming differences
NORMALIZE = {
    "django_phonenumber_field": "django-phonenumber-field",
    "phonenumber_field": "django-phonenumber-field",
}

# Extra deps we can infer from code/config
INFER_RULES = [
    # If you use ImageField anywhere, you almost always need Pillow installed
    (re.compile(r"\bmodels\.ImageField\b"), "Pillow"),

    # If settings uses Postgres engine, add psycopg2-binary
    (re.compile(r"django\.db\.backends\.postgresql"), "psycopg2-binary"),

    # If corsheaders app or middleware exists, add django-cors-headers
    (re.compile(r"\bcorsheaders\b"), "django-cors-headers"),

    # If phone number field is used, ensure phonenumbers is present
    (re.compile(r"\bPhoneNumberField\b|\bphonenumber_field\b"), "phonenumbers"),
]


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, cwd=ROOT, check=True, stdout=subprocess.DEVNULL)


def read_all_project_text() -> str:
    parts = []
    for p in ROOT.rglob("*.py"):
        if any(x in p.parts for x in ("venv", ".venv", "__pycache__", "migrations")):
            continue
        try:
            parts.append(p.read_text(encoding="utf-8", errors="ignore"))
        except Exception:
            pass
    return "\n".join(parts)


def parse_requirements(req_path: Path) -> set[str]:
    pkgs: set[str] = set()
    if not req_path.exists():
        return pkgs
    for line in req_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # handle Django==x.y.z or Django>=...
        name = re.split(r"[<=>!~\[]", line, maxsplit=1)[0].strip()
        if name:
            pkgs.add(name)
    return pkgs


def pin_versions(pkgs: set[str]) -> list[str]:
    out = []
    for name in sorted(pkgs, key=str.lower):
        pkg_name = NORMALIZE.get(name, name)
        try:
            v = pkg_version(pkg_name)
            out.append(f"{pkg_name}=={v}")
        except Exception:
            # If not installed, keep unpinned so install can still work
            out.append(pkg_name)
    return out


def main() -> None:
    # 1) generate base requirements from imports
    run([sys.executable, "-m", "pipreqs", ".", "--force"])

    base = parse_requirements(REQ_FILE)

    # 2) infer extras from project text
    text = read_all_project_text()
    inferred = set()
    for pattern, pkg in INFER_RULES:
        if pattern.search(text):
            inferred.add(pkg)

    final = base | inferred

    # 3) write pinned requirements from the current venv versions
    pinned = pin_versions(final)
    REQ_FILE.write_text("\n".join(pinned) + "\n", encoding="utf-8")
    print(f"Wrote {REQ_FILE} with {len(pinned)} packages.")


if __name__ == "__main__":
    main()