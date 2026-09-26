#!/usr/bin/env python3
"""Assemble src/ into the single-file index.html.

The app ships as one self-contained HTML file: the artifact host and GitHub
Pages both serve it with no build step, and the logo is inlined so there are
no external requests. Sources live in src/ and are concatenated in filename
order within each group.

    python3 build.py
"""
import base64
import pathlib

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"

GROUPS = [
    ["01-tokens.css", "02-shell.css", "03-document.css"],
    ["10-workspace.html", "11-views.html"],
    ["20-core.js", "21-docx.js", "22-editor.js", "23-views.js", "24-chat.js"],
]


def main():
    logo = "data:image/png;base64," + base64.b64encode((SRC / "logo.png").read_bytes()).decode()
    out = "".join((SRC / name).read_text() for group in GROUPS for name in group)
    out = out.replace("__LOGO__", logo)
    (ROOT / "index.html").write_text(out)
    print(f"built index.html — {len(out):,} bytes")


if __name__ == "__main__":
    main()
