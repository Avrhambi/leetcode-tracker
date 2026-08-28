#!/usr/bin/env python3
"""PostToolUse hook: lint the edited file, typecheck the project.

The previous hook ran `npm run lint` (`eslint .`) on every Edit/Write, linting
the whole project once per file touched. Steady-state that was ~3.3s of lint plus
~3.1s of typecheck per edit. Passing eslint just the edited file removes most of
the lint half.

Claude Code exposes the edited path only as `tool_input.file_path` in the JSON on
stdin -- there is no environment variable for it -- so this has to be a script
rather than an inline command. It is Python because `jq` is not installed here and
Python 3.14 already runs the global hooks; nothing new is introduced.

Typecheck stays project-wide: `tsc -b` cannot meaningfully check one file in
isolation, and at ~3.1s it is not what needed fixing.

Exit codes: 0 on success, 2 on failure so stderr reaches Claude as a warning
without discarding the edit.
"""

import json
import subprocess
import sys
from pathlib import Path

LINTABLE = {".ts", ".tsx"}
PROJECT_DIR = Path(__file__).resolve().parent.parent.parent


def run(args):
    """Run a command in the project dir, returning (ok, combined_output)."""
    try:
        proc = subprocess.run(
            args,
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True,
            shell=True,
            timeout=180,
            # eslint/tsc emit UTF-8 (box-drawing, arrows, smart quotes). Without
            # this, Python decodes with the console codepage -- cp1255 on this
            # machine -- and a UnicodeDecodeError kills the reader thread before
            # the diagnostics can be read.
            encoding="utf-8",
            errors="replace",
        )
    except (OSError, subprocess.SubprocessError) as exc:
        # Never fail the edit because the checker itself broke.
        print(f"lint-edited: could not run {args!r}: {exc}", file=sys.stderr)
        return True, ""
    return proc.returncode == 0, (proc.stdout or "") + (proc.stderr or "")


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        payload = {}

    tool_input = payload.get("tool_input")
    file_path = tool_input.get("file_path") if isinstance(tool_input, dict) else None

    if file_path:
        suffix = Path(file_path).suffix.lower()
        if suffix not in LINTABLE:
            # Not a TypeScript file: nothing for eslint or tsc to say.
            return 0
        lint_target = f'"{file_path}"'
    else:
        # No path in the payload -- fall back to the whole project rather than
        # silently checking nothing. A slow hook beats one that only looks busy.
        lint_target = "."

    failures = []

    ok, output = run(f"npx eslint {lint_target}")
    if not ok:
        failures.append(output.strip())

    ok, output = run("npx tsc -b --pretty false")
    if not ok:
        failures.append(output.strip())

    if failures:
        print(
            "lint-edited: checks failed after this edit.\n\n"
            + "\n\n".join(f for f in failures if f),
            file=sys.stderr,
        )
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
