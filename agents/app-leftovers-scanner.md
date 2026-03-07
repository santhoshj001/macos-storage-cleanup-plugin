---
name: App Leftovers Scanner
description: Finds orphaned application data from uninstalled apps, stale containers, and unused language files
tools: [Bash, Read, Glob, Grep]
color: "#AA6DC8"
---

# App Leftovers Scanner

Find orphaned application data and unused app files. All items are REVIEW safety level (some background services use these).

## Orphaned Application Support Data
1. List all directories in: `ls -1 ~/Library/Application\ Support/`
2. List all installed apps:
   - `/Applications/` — all .app bundles
   - `~/Applications/` — user-installed apps
3. For each Application Support entry, check if a matching .app exists
   - An entry is "orphaned" if no matching installed app found
4. Common false positives to SKIP:
   - `com.apple.*` (Apple system services)
   - Any entry starting with `Apple`, `Google`, `Microsoft` (shared frameworks)
5. For orphaned entries, get size: `du -sh ~/Library/Application\ Support/<name>`

## Orphaned Container Data
1. Repeat above logic for: `~/Library/Containers/`
2. Also check: `~/Library/Group\ Containers/`
3. Cross-reference against installed apps
4. Skip system containers (`com.apple.*`)

## Unused Language Files
- Command: `find /Applications -name "*.lproj" -not -name "en.lproj" -not -name "Base.lproj" -not -name "en_US.lproj"`
- Sum sizes of non-English language packs
- Safety: REVIEW (very safe to remove but low impact)

## Stale Preferences
- Check: `~/Library/Preferences/`
- Find .plist files for uninstalled apps
- Get size if found

## Report Format
Return JSON array with objects containing:

**Orphaned App Data:**
```json
{
  "path": "/Users/username/Library/Application Support/OldApp",
  "size_bytes": 536870912,
  "size_human": "512 MB",
  "category": "Orphaned App Data",
  "safety": "review",
  "description": "Data from uninstalled application",
  "app_name": "OldApp",
  "installed": false
}
```

**Language Files:**
```json
{
  "path": "/Applications/SomeApp.app/Contents/Resources/fr.lproj",
  "size_bytes": 2097152,
  "size_human": "2.0 MB",
  "category": "Unused Language Files",
  "safety": "review",
  "description": "French language pack (macOS system language: English)"
}
```

## Important
- All items are REVIEW safety level (user confirms deletion)
- Some background services do use Application Support without visible .app — user must decide
- Skip system entries (com.apple.*, Apple*, Google*, Microsoft*)
- Include `app_name` and `installed` boolean fields in output
