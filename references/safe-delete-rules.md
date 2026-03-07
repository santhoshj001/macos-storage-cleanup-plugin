# Safe Deletion Rules for macOS Storage Cleanup

This is the safety knowledge base that all scanner agents reference before any file deletion operation.

## Safety Classification System

Files and directories are classified into two tiers:

### SAFE (Green Checkmark) — Auto-Regenerated Files
Can be batch-deleted without user confirmation. These are regenerated automatically by the system or applications:
- System caches (~/Library/Caches/*)
- Browser caches and data
- Package manager caches (npm, pip, cargo, brew, etc.)
- Old logs (>30 days old)
- Temporary files (/tmp/*, /private/tmp/*, /var/folders/*/*/C/)
- Build caches (Xcode DerivedData, build artifacts)
- Saved application state (~/Library/Saved Application State/)
- Crash reports (/Library/Logs/DiagnosticReports/)
- Spotlight index (/.Spotlight-V100/)
- Gradle caches and wrapper distributions
- Docker dangling images and build cache

### REVIEW (Warning) — Requires Individual User Decision
Each item must be presented to the user before deletion:
- iOS device backups (~/Library/Application Support/MobileSync/Backup/)
- Old Downloads (files >30 days old)
- iMessage attachments and media (~/Library/Messages/Attachments/)
- Mail attachments (~/Library/Mail/, ~/Library/Containers/com.apple.mail/)
- Android AVD emulators (~/.android/avd/)
- Docker volumes (may contain database data)
- Xcode Archives (~/Library/Developer/Xcode/Archives/) — may contain App Store submissions
- Android SDK components (platforms, system-images, build-tools, NDK)
- App leftover files (~/Library/Application Support/*, ~/Library/Containers/*)
- Stale project artifacts (node_modules with no recent git activity, Rust target/, Python venv/)
- Creative app data (Adobe, Final Cut Pro, GarageBand, Logic Pro)
- Time Machine local snapshots (requires elevated privileges)

## Hardcoded Never-Delete List

These paths must NEVER be touched, even if marked as safe:

**Credentials & Security:**
- `~/.ssh/` — SSH keys
- `~/.gnupg/` — GPG keys
- `~/.aws/` — AWS credentials
- `~/.config/gcloud/` — Google Cloud credentials
- `~/.android/debug.keystore` — Android app signing key
- `~/.android/adbkey` — Android Debug Bridge key
- `~/.android/adbkey.pub` — ADB public key
- `~/Library/Keychains/` — macOS keychain data

**System Protected:**
- `/System/` (entire tree) — SIP-protected
- `/Applications/` — Installed applications
- `/Library/System/` — System libraries
- `/var/vm/sleepimage` — Sleep image file
- `/var/vm/swapfile*` — Virtual memory swap files
- `/Library/Updates/` — Pending system updates

**Shell & Configuration:**
- `~/.zshrc` — Zsh configuration
- `~/.bashrc` — Bash configuration
- `~/.bash_profile` — Bash profile
- `~/.profile` — Shell profile

**Git & Environment:**
- Any file tracked by git (check with `git ls-files` in repository root)
- `.env` files anywhere in the filesystem
- `.env.*` (environment variable files)

## Pre-Deletion Safety Checks

Run these verification steps before deleting any file:

1. **Active Use Check:**
   - Run: `lsof <path>` to ensure file is not in active use by any process
   - If in use, skip deletion and warn user

2. **File Age Verification:**
   - For cache files: `stat -f "%m" <path>` (macOS) or `find <path> -mtime +30`
   - For logs: Verify age >30 days before considering safe
   - For downloads: Verify age >30 days

3. **User Exclusion List:**
   - Check `~/.macos-cleanup/config.json` for user-defined safe zones
   - Never delete paths in exclusion list, even if classified as SAFE

4. **App Leftovers Cross-Reference:**
   - For files in ~/Library/Application Support/ or ~/Library/Containers/:
   - Verify corresponding app does NOT exist in `/Applications/`
   - Verify corresponding app does NOT exist in `~/Applications/`

5. **Git Repository Activity:**
   - For node_modules or other build artifacts:
   - Check parent repository git activity: `git log -1 --format=%ct <repo-root>`
   - If git activity <7 days old, mark as REVIEW (active development)

## Deletion Method & Logging

**Always use safe deletion, never destructive commands:**

- Use `mv <path> ~/.Trash/` to move files to Trash (recoverable)
- NEVER use `rm`, `rm -rf`, or `shred` (unrecoverable)

**Log every deletion to `~/.macos-cleanup/deletions-{timestamp}.json`:**

Format:
```json
{
  "timestamp": "2026-03-07T14:30:00Z",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "items": [
    {
      "path": "/Users/username/Library/Caches/Chrome",
      "size_bytes": 1073741824,
      "category": "browser-cache",
      "safety": "safe"
    },
    {
      "path": "/Users/username/Library/Application Support/MobileSync/Backup/ABC123DEF456",
      "size_bytes": 5368709120,
      "category": "ios-backup",
      "safety": "review",
      "device_info": "iPhone 15 Pro - 2026-03-01"
    }
  ],
  "total_bytes_freed": 6442450944
}
```

**Create ~/.macos-cleanup/ directory if missing.**

## Special Warnings

These items require special handling before deletion:

### iMessage Media
- **Path:** `~/Library/Messages/Attachments/`
- **Warning:** CANNOT BE RECOVERED ONCE DELETED FROM TRASH
- **Action:** Display prominent warning to user with option to back up first
- **Check command:** `du -sh ~/Library/Messages/Attachments/`

### iOS Device Backups
- **Path:** `~/Library/Application Support/MobileSync/Backup/`
- **Warning:** Show device name and backup date before deletion
- **Extraction:** Parse `Info.plist` inside backup folder:
  ```bash
  plutil -p "~/Library/Application Support/MobileSync/Backup/*/Info.plist"
  ```
- **Display format:** "iPhone 15 Pro - Last backed up: 2026-03-01"

### Time Machine Local Snapshots
- **Command to list:** `tmutil listlocalsnapshots /`
- **Deletion command:** `sudo tmutil deletelocalsnapshots <date>` (requires elevated privileges)
- **Warning:** Requires administrator password (Full Disk Access not sufficient)
- **Size estimate:** Each snapshot ~2-5GB typically; count with: `tmutil listlocalsnapshots / | wc -l`
- **Action:** Prominently warn about elevated privileges requirement

### Docker Volumes
- **Command to list:** `docker volume ls -f dangling=true`
- **Risk:** May contain database data, persistent application state
- **Action:** Always mark as REVIEW, show volume size and creation date
- **Safe command:** `docker system df -v` to list all volumes with sizes

### Xcode Archives
- **Path:** `~/Library/Developer/Xcode/Archives/`
- **Risk:** May contain App Store submissions or signed builds
- **Action:** Always mark as REVIEW, show app name and archive date
- **Size:** Individual archives often 1-5GB each

## SIP-Protected Paths

These paths cannot be deleted even with `sudo` due to System Integrity Protection:

- `/var/vm/sleepimage` — Sleep image file
- `/var/vm/swapfile*` — Virtual memory swap files
- `/Library/Updates/` — Pending system updates
- `/System/` (entire tree)

**Action:** Skip silently if encountered. Do not attempt deletion or warn user about permission denied.

## Full Disk Access Requirement

Some paths require Full Disk Access (FDA) permission in System Preferences:

**Paths requiring FDA:**
- `~/Library/Mail/` — Mail application data
- `~/Library/Messages/` — iMessage attachments and data
- Some `~/Library/Containers/` paths (especially mail and messages)

**Detection:**
```bash
ls ~/Library/Mail/ 2>&1
# If output: "Operation not permitted" → FDA is missing
```

**Action:** If FDA is missing and user wants to clean these paths:
1. Inform user that Full Disk Access is required
2. Display instructions: System Preferences → Security & Privacy → Privacy → Full Disk Access
3. Add terminal/Claude Code to the FDA list
4. Retry operation after FDA is granted
