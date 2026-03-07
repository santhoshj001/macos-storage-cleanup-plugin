---
name: cleanup-safe-zones
description: "Manage path exclusion list — add, remove, or list protected paths"
arguments:
  - name: action
    description: "Action: --add <path>, --remove <path>, --list"
    required: false
    default: "--list"
---

Manage the safe-zones exclusion list.

Config file: `~/.macos-cleanup/config.json`

Parse the action argument:
- `--list`: Show all currently excluded paths
- `--add <path>`: Add a path to the exclusion list. Resolve to absolute path. Verify the path exists.
- `--remove <path>`: Remove a path from the exclusion list.

Config format:
```json
{
  "safe_zones": [
    "/Users/username/Projects/important-project",
    "/Users/username/Documents/tax-returns"
  ],
  "created": "ISO-8601",
  "updated": "ISO-8601"
}
```

If config file doesn't exist, create it with empty safe_zones array.
Show confirmation after add/remove operations.
Excluded paths are checked by all scanner agents during cleanup — they will never suggest deleting anything under an excluded path.
