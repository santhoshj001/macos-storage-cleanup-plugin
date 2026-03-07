---
name: cleanup-execute
description: "Execute storage cleanup — move selected items to Trash"
arguments:
  - name: mode
    description: "Options: --dry-run (preview only), --confirm (execute deletion), --from-report (use HTML report selections)"
    required: false
    default: "--dry-run"
---

Execute the storage cleanup based on scan results.

Parse the mode argument:
- `--dry-run` (default): Show what WOULD be deleted, with sizes. No actual deletion.
- `--confirm`: Actually move files to `~/.Trash/`. Requires prior scan results in `~/.macos-cleanup/scan-latest.json`.
- `--from-report`: Read user selections from `~/.macos-cleanup/user-selections.json` (created by the HTML report).

Steps for `--confirm`:
1. Read scan results from `~/.macos-cleanup/scan-latest.json`
2. Display itemized list grouped by safety:
   - SAFE items: Show as batch with "Delete all safe items? (X.X GB)"
   - REVIEW items: Show each individually with description for yes/no decision
3. For each approved item:
   - Check `lsof` to ensure not in active use
   - Check against never-delete list and safe-zones
   - Move to `~/.Trash/` using `mv`
4. Log all operations to `~/.macos-cleanup/deletions-{timestamp}.json`
5. Show before/after disk usage summary

Safety: Reference `references/safe-delete-rules.md` for all safety checks.
