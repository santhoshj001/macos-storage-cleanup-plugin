---
name: cleanup-duplicates
description: "Find duplicate files by size pre-filter and MD5 hash comparison"
arguments:
  - name: min-size
    description: "Minimum file size to check (default: 1M)"
    required: false
    default: "1M"
  - name: path
    description: "Directory to scan (default: home directory)"
    required: false
    default: "~"
---

Find duplicate files efficiently.

Strategy (size pre-filter + hash):
1. Find files larger than min-size in the target path
2. Group files by exact file size (only files with matching sizes can be duplicates)
3. For size groups with 2+ files, compute MD5 hash: `md5 -q <file>`
4. Group by hash — matching hashes = duplicate files
5. Sort duplicate groups by total wasted space (size × (count - 1))
6. Display results showing:
   - Hash group with total wasted space
   - All file paths in the group with modification dates
   - Suggestion for which to keep (newest or most logical path)

Limit scan depth to `-maxdepth 5` to avoid excessive crawling. Skip hidden directories, node_modules, .git, and Library/Caches.
