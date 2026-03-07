# macOS Storage Cleanup — Claude Code Plugin

**A plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) that finds and cleans hidden storage hogs on macOS — from system caches to Xcode DerivedData, iOS backups to Docker images.**

Mac users unknowingly accumulate 50-500 GB of recoverable space across system caches, old downloads, iOS backups, Time Machine snapshots, iMessage media, and app leftovers. Developers face even more: Xcode DerivedData (40-80 GB), Android Studio emulators (50-100 GB), Docker images, and package manager caches everywhere.

This plugin brings it all into a single AI-powered Claude Code experience with safe, trash-based cleanup.

---

## Features

| Category | What It Finds | Typical Recovery |
|----------|--------------|------------------|
| System caches & logs | Browser caches, app caches, old logs, temp files | 5-25 GB |
| Downloads & user files | Old .dmg/.pkg/.zip, screenshots, large stale files | 10-100 GB |
| Communications | Mail attachments, iMessage photos/videos/GIFs | 5-30 GB |
| Backups & snapshots | iOS device backups, Time Machine local snapshots | 10-80 GB |
| App leftovers | Orphaned data from uninstalled apps, unused languages | 2-15 GB |
| Xcode & iOS dev | DerivedData, simulators, device support, archives | 40-200 GB |
| Android dev | Studio caches, SDK platforms, AVD emulators, Gradle | 10-100 GB |
| Package managers | npm, cargo, pip, brew, yarn, pnpm, maven, go, bun | 5-30 GB |
| Docker | Dangling images, build cache, unused volumes | 5-50 GB |

**Total potential recovery: 50-500+ GB**

### Safety First

- All deletions go to `~/.Trash/` (never `rm`) — recoverable for 30 days
- Two-tier safety: **SAFE** items (caches) can be batch-deleted; **REVIEW** items require individual approval
- Credentials are never touched (`~/.ssh`, `~/.gnupg`, `~/.aws`, `~/.android/debug.keystore`)
- Dry-run by default — must explicitly confirm before any deletion
- Every operation is logged for full undo capability

---

## Installation

### Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- macOS 13+ (Ventura or later recommended)
- Node.js 18+ (optional — only needed for the interactive HTML report)

### Step 1: Clone the Repository

```bash
git clone https://github.com/santhoshj001/macos-storage-cleanup-plugin.git
```

### Step 2: Install the Plugin

```bash
claude plugin add /path/to/macos-storage-cleanup
```

Or if you cloned it to a standard location:

```bash
claude plugin add ~/macos-storage-cleanup
```

### Step 3: Run First-Time Setup

Inside Claude Code, run:

```
/cleanup-setup
```

This will:
1. Create the `~/.macos-cleanup/` configuration directory
2. Check if Full Disk Access is granted (needed for Mail/iMessage scanning)
3. Optionally install a low-disk warning hook that alerts you when disk space is low

### Step 4: Grant Full Disk Access (Optional but Recommended)

For complete scanning of Mail and iMessage data:

1. Open **System Settings**
2. Go to **Privacy & Security > Full Disk Access**
3. Click **+** and add your terminal app (Terminal, iTerm2, Warp, etc.)
4. Restart your terminal

Without FDA, the plugin still works but skips Mail and iMessage scanning.

### Verify Installation

```
/cleanup-disk-usage
```

You should see a disk usage overview. If the command is recognized, the plugin is installed correctly.

---

## Quick Start

### 1. See What's Taking Up Space

```
/cleanup-scan
```

This runs 5 general scanner agents in parallel and shows a categorized breakdown:

```
DISK: 412 GB / 500 GB used (82%)

-- GENERAL ----------------------------------------
  System caches & logs       8.7 GB   auto-regenerated
  Old Downloads (>30 days)  12.3 GB   47 files
  iOS backup (iPhone 15)    28.4 GB   backup from 2025-11
  iMessage media             8.9 GB   photos, videos, GIFs
  Orphaned app data          3.7 GB   5 uninstalled apps
---------------------------------------------------
TOTAL RECOVERABLE:          62.0 GB
```

### 2. Add Developer Scanning

```
/cleanup-scan --dev
```

Adds Xcode, Android Studio, Docker, and package manager scanning.

### 3. Quick Safe Cleanup

```
/cleanup-quick
```

One-command cleanup of only auto-regenerated caches. Single confirmation, no decisions needed.

### 4. Interactive HTML Report

```
/cleanup-report
```

Opens a browser-based report where you can check/uncheck items, see a running total, and submit your selections.

### 5. Execute Cleanup

```
/cleanup-execute --dry-run     # Preview what would be deleted
/cleanup-execute --confirm     # Actually delete (moves to Trash)
/cleanup-execute --from-report # Use selections from HTML report
```

### 6. Undo If Needed

```
/cleanup-restore
```

Browse past cleanup sessions and restore any files still in Trash.

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `/cleanup-scan [--dev] [--full]` | Full storage analysis |
| `/cleanup-execute [--dry-run\|--confirm\|--from-report]` | Execute cleanup operations |
| `/cleanup-quick` | One-command safe cleanup (caches only) |
| `/cleanup-disk-usage` | Quick disk capacity overview |
| `/cleanup-large-files [--size 500M]` | Find large files via Spotlight |
| `/cleanup-duplicates [--min-size 1M]` | Find duplicate files by hash |
| `/cleanup-report` | Generate interactive HTML report |
| `/cleanup-restore` | Restore files from a previous cleanup |
| `/cleanup-health` | Disk health dashboard with trends |
| `/cleanup-history` | View past cleanup sessions |
| `/cleanup-safe-zones [--add\|--remove\|--list]` | Manage path exclusion list |
| `/cleanup-setup` | First-run setup and permissions check |

### Scan Modes

| Mode | Flag | What It Scans |
|------|------|---------------|
| General | *(default)* | System caches, downloads, backups, mail, app leftovers |
| Developer | `--dev` | General + Xcode, Android Studio, Docker, package managers |
| Full | `--full` | All scanners + deep duplicate detection |

---

## Architecture

```
Plugin
  |
  |-- /cleanup-scan (command)
  |       |
  |       v
  |   storage-analysis (skill) -- orchestrates the scan
  |       |
  |       |-- Batch 1: 5 General Agents (parallel)
  |       |     |-- system-scanner
  |       |     |-- user-files-scanner
  |       |     |-- communications-scanner
  |       |     |-- backups-snapshots-scanner
  |       |     +-- app-leftovers-scanner
  |       |
  |       +-- Batch 2: 2 Developer Agents (parallel, --dev only)
  |             |-- mobile-dev-scanner
  |             +-- backend-dev-scanner
  |
  |-- /cleanup-report (command)
  |       |
  |       v
  |   report-server.js --> report.html (browser)
  |       |                    |
  |       +-- POST /submit <---+
  |               |
  |               v
  |       user-selections.json
  |
  +-- /cleanup-execute --from-report
          |
          v
      Move to ~/.Trash/ + log to deletions-*.json
```

### How Agents Work

Each scanner agent runs independently and returns structured results. The coordinator:

1. Dispatches agents in batches to avoid context overflow
2. Aggregates results from all agents
3. Deduplicates by path prefix (no double-counting)
4. Classifies each item as SAFE or REVIEW
5. Saves consolidated results for the report and execute commands

### Data Storage

All plugin data lives in `~/.macos-cleanup/`:

```
~/.macos-cleanup/
  config.json              # Safe-zones exclusion list
  scan-latest.json         # Most recent scan results
  scan-history.json        # Historical scan data for trends
  report.html              # Generated HTML report
  user-selections.json     # Selections from HTML report
  deletions-*.json         # Cleanup session logs (for restore)
```

---

## Safety Guarantees

### What We Never Delete

| Path | Reason |
|------|--------|
| `~/.ssh/` | SSH keys |
| `~/.gnupg/` | GPG keys |
| `~/.aws/` | AWS credentials |
| `~/.android/debug.keystore` | Android signing key |
| `~/.android/adbkey*` | ADB connection keys |
| `~/Library/Keychains/` | macOS keychain |
| `/System/`, `/Applications/` | SIP-protected |
| `.env`, `.env.*` | Environment secrets |
| Git-tracked files | Active source code |

### Safety Classification

- **SAFE**: Auto-regenerated files (caches, build artifacts, logs >30 days). Can be batch-deleted.
- **REVIEW**: User data that requires individual approval (backups, downloads, media, Docker volumes).

### Pre-Deletion Checks

Before every deletion, the plugin:
1. Checks `lsof` to ensure the file isn't in active use
2. Verifies the path isn't in the user's exclusion list
3. Confirms the path isn't in the hardcoded never-delete list
4. For app leftovers: cross-references against installed applications
5. For project artifacts: checks git activity in the parent repository

---

## Configuration

### Exclusion List (Safe Zones)

Protect specific paths from ever being suggested for cleanup:

```
/cleanup-safe-zones --add ~/Projects/critical-project
/cleanup-safe-zones --add ~/Documents/tax-returns
/cleanup-safe-zones --list
/cleanup-safe-zones --remove ~/Projects/old-project
```

Configuration is stored in `~/.macos-cleanup/config.json`.

### Low-Disk Warning Hook

The `/cleanup-setup` command can install an optional hook in `~/.claude/settings.json` that warns you at the start of each Claude Code session when disk usage exceeds 80%.

---

## Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| macOS 13+ | Required | Uses macOS-specific paths and commands |
| Claude Code CLI | Required | Plugin host environment |
| Node.js 18+ | Optional | Only for interactive HTML report server |
| Full Disk Access | Optional | Enables Mail/iMessage scanning |

---

## Troubleshooting

### "Operation not permitted" errors

Your terminal needs Full Disk Access. See [Installation Step 4](#step-4-grant-full-disk-access-optional-but-recommended).

### Commands not recognized

Verify the plugin is installed:
```bash
claude plugin list
```

If not listed, re-install:
```bash
claude plugin add /path/to/macos-storage-cleanup
```

### HTML report won't open

The report server requires Node.js. If Node.js isn't installed, the plugin falls back to opening a static HTML file with a "Copy to Clipboard" button.

### Scanner reports 0 GB for a category

The path may not exist on your system (e.g., no Xcode installed, no Docker). This is expected — the scanner skips missing paths silently.

### Can't delete Time Machine snapshots

Time Machine snapshot deletion requires `sudo`. The plugin will warn you and provide the exact command to run manually.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and the PR process.

## Security

See [SECURITY.md](SECURITY.md) for our security model and how to report vulnerabilities.

## License

[MIT](LICENSE)
