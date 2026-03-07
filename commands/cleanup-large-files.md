---
name: cleanup-large-files
description: "Find large files using fast Spotlight queries"
arguments:
  - name: size
    description: "Minimum file size (default: 500M). Examples: 100M, 1G, 500M"
    required: false
    default: "500M"
---

Find large files on the system using Spotlight for speed.

1. Parse the size argument into bytes (e.g., 500M = 524288000, 1G = 1073741824)
2. Use `mdfind "kMDItemFSSize > {bytes}"` for fast Spotlight-indexed search
3. For each result, get: path, size, last modified date, file type
4. Sort by size descending
5. Group by location (Downloads, Documents, Library, Developer, etc.)
6. Show top 50 results in a table with: Size | Last Modified | Path
7. Highlight files that are likely safe to delete (e.g., .dmg, .pkg in Downloads)
