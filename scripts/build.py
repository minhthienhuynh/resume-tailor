#!/usr/bin/env python3
"""build.py -- compile a resume .tex and report verification metrics.

Usage: python3 build.py <path-to-tex>

Mechanical only: builds the PDF and reports engine used / exit code / page
count / errors / last text line per page. Layout judgement (is it clipped?
right page count?) is left to the caller (Claude reads the PDF and decides).

Output dir stays clean: only the .tex and the resulting .pdf remain. Build
artifacts (.aux/.log/.out/...) are built in a throwaway temp dir and
discarded.

Engine selection: prefers Tectonic (self-contained, fetches LaTeX packages
from a CTAN bundle on first use -- no need for a full TeX Live install).
Falls back to pdflatex if Tectonic isn't available but pdflatex is. If
neither is installed, prints install instructions and exits non-zero.
"""

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def find_engine():
    if shutil.which("tectonic"):
        return "tectonic"
    if shutil.which("pdflatex"):
        return "pdflatex"
    return None


def print_install_instructions():
    print("=== no LaTeX engine found ===", file=sys.stderr)
    print("Install Tectonic (recommended, no TeX Live needed):", file=sys.stderr)
    print("  macOS:   brew install tectonic", file=sys.stderr)
    print("  cargo:   cargo install tectonic", file=sys.stderr)
    print("  conda:   conda install -c conda-forge tectonic", file=sys.stderr)
    print("  script:  see https://tectonic-typesetting.github.io/", file=sys.stderr)
    print("", file=sys.stderr)
    print("Or install a full TeX Live distribution (provides pdflatex):", file=sys.stderr)
    print("  macOS:   brew install --cask mactex-no-gui", file=sys.stderr)
    print("  Debian:  sudo apt install texlive-full", file=sys.stderr)
    print("  Windows: install MiKTeX or TeX Live", file=sys.stderr)


def run_tectonic(tex_path: Path, build_dir: Path):
    return subprocess.run(
        [
            "tectonic",
            "--outdir",
            str(build_dir),
            str(tex_path),
        ],
        capture_output=True,
        text=True,
    )


def run_pdflatex(tex_path: Path, build_dir: Path):
    return subprocess.run(
        [
            "pdflatex",
            "-interaction=nonstopmode",
            "-halt-on-error",
            "-output-directory",
            str(build_dir),
            str(tex_path),
        ],
        capture_output=True,
        text=True,
    )


def print_error_context(result, log_path: Path):
    print("=== build FAILED -- error output ===")
    # Tectonic reports errors on stderr; pdflatex writes them into the .log
    # file (and duplicates some onto stdout). Print whichever has content,
    # trying the classic pdflatex "! " marker first since that format is
    # well understood; otherwise fall back to raw stderr/stdout.
    printed = False
    if log_path.exists():
        lines = log_path.read_text(errors="replace").splitlines()
        error_lines = [i for i, line in enumerate(lines) if line.startswith("! ")]
        for i in error_lines[:5]:
            print("\n".join(lines[i : i + 4]))
            printed = True
    if not printed and result.stderr:
        print(result.stderr.strip()[:2000])
        printed = True
    if not printed and result.stdout:
        print(result.stdout.strip()[:2000])
        printed = True
    if not printed:
        print("(no error details captured)")


def verify_pdf(pdf_path: Path):
    try:
        from pypdf import PdfReader
    except ImportError:
        print("=== pypdf not installed, skipping page/clip verification ===")
        print("Install it with: pip install pypdf")
        return

    reader = PdfReader(str(pdf_path))
    print("=== pages ===")
    print(f"Pages: {len(reader.pages)}")

    print("=== last non-empty text line of each page (eyeball for clipped content) ===")
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        last_line = lines[-1] if lines else "(no text extracted)"
        print(f"[p{i}] {last_line}")


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 build.py <path-to-tex>", file=sys.stderr)
        sys.exit(2)

    tex_path = Path(sys.argv[1]).resolve()
    if not tex_path.is_file():
        print(f"Error: tex file not found: '{tex_path}'", file=sys.stderr)
        sys.exit(2)

    engine = find_engine()
    if engine is None:
        print_install_instructions()
        sys.exit(1)

    print(f"=== compiling with {engine}: {tex_path} ===")

    build_dir = Path(tempfile.mkdtemp())
    try:
        if engine == "tectonic":
            result = run_tectonic(tex_path, build_dir)
            log_path = build_dir / (tex_path.stem + ".log")
        else:
            result = run_pdflatex(tex_path, build_dir)
            log_path = build_dir / (tex_path.stem + ".log")

        print(f"{engine} exit: {result.returncode}")

        built_pdf = build_dir / (tex_path.stem + ".pdf")
        if result.returncode != 0 or not built_pdf.is_file():
            print_error_context(result, log_path)
            sys.exit(1)

        # Success: copy only the PDF next to the .tex; build artifacts vanish
        # with build_dir.
        final_pdf = tex_path.with_suffix(".pdf")
        shutil.copyfile(built_pdf, final_pdf)

        if engine == "pdflatex" and log_path.exists():
            log_text = log_path.read_text(errors="replace")
            overfull_count = sum(
                1 for line in log_text.splitlines() if "overfull" in line.lower()
            )
            print("=== overfull box count ===")
            print(overfull_count)

        verify_pdf(final_pdf)
    finally:
        shutil.rmtree(build_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
