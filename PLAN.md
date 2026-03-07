# macOS Storage Cleanup — Claude Code Plugin — Design Plan

## Context

Mac users accumulate massive hidden storage — iOS backups (10-50GB each), Time Machine snapshots (10-80GB invisibly), mail/iMessage attachments, old downloads, caches everywhere. Developers face worse: Xcode DerivedData (40-80GB), Android Studio + emulators (50-100GB), Docker images, and package manager caches. This plugin unifies everything into a single AI-powered Claude Code experience.

## Design Philosophy

1. **General user first** — Downloads, Desktop, Mail, Messages, iOS backups, app leftovers, system junk
2. **Developer second** — Xcode, Android Studio, Docker, node_modules, package managers (opt-in via `--dev`)
3. **Safety always** — Trash-based deletion, dry-run by default, never touch sensitive files

---

## Architectural Review — Issues Found & Fixes

### CRITICAL FIXES (must address)

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| **Plugin manifest location wrong** | Plan had `plugin.json` at root | Must be `.claude-plugin/plugin.json` |
| **Hooks can't be in plugin files** | Hooks are GLOBAL only (in `~/.claude/settings.json`) | Provide setup command `/cleanup-setup` that installs hook into settings.json |
| **Command names used colons** | Colons invalid in filenames (`/cleanup:scan`) | Use hyphens: `/cleanup-scan` |
| **HTML can't write to filesystem** | Browser sandbox blocks direct file writes | Use local server script (`scripts/report-server.js`) to serve HTML + accept POST of selections, OR use Claude Preview MCP tools |
| **14 parallel agents risks context overflow** | Too many results to aggregate in one context | Run agents in 2 batches max; consolidate from 14 → 8 focused agents |

### HIGH PRIORITY FIXES

| Issue | Fix |
|-------|-----|
| **45 files is unprecedented for a plugin** | Consolidate to ~30 files by combining agents and removing v2 features |
| **3-tier agent system overcomplicated** | Simplify to 2 tiers: General (default) + Developer (--dev) — fold "extended" into general |
| **Missing Full Disk Access check** | Add permission check in scan command before accessing ~/Library paths |
| **SIP blocks system paths** | Skip `/var/vm/`, `/Library/Updates/` silently; document as known limitation |
| **Scheduled tasks can't parallelize** | `scheduled-cleanup` runs single-pass safe-only cleanup, not full agent scan |
| **Deduplication across agents is nontrivial** | Write results to JSON files; coordinator reads and deduplicates by path prefix |

### SCOPE REDUCTION (v1 vs v2)

| Feature | v1 (ship now) | v2 (later) |
|---------|--------------|------------|
| Core scan + execute | Yes | |
| Interactive HTML report | Yes (with local server) | |
| Quick cleanup | Yes | |
| Restore/undo | Yes | |
| Disk health check | Yes | |
| Cleanup history | Yes | |
| Scheduled cleanup | | Yes |
| Git repo cleanup | | Yes |
| Dependency audit | | Yes |
| Before/after visual report | | Yes (auto-generated after cleanup) |

---

## Revised Plugin Architecture

**Name:** `macos-storage-cleanup`
**Location:** `/Users/santhoshj/Documents/2026/FileCleanUp/`

### Directory Structure

```
FileCleanUp/
├── .claude-plugin/
│   └── plugin.json                        # Plugin manifest (REQUIRED location)
│
├── commands/                              # 12 slash commands
│   ├── cleanup-scan.md                    # /cleanup-scan [--dev] [--full]
│   ├── cleanup-execute.md                 # /cleanup-execute [--dry-run] [--confirm] [--from-report]
│   ├── cleanup-quick.md                   # /cleanup-quick (safe-only, one-command)
│   ├── cleanup-disk-usage.md              # /cleanup-disk-usage
│   ├── cleanup-large-files.md             # /cleanup-large-files [--size 500M]
│   ├── cleanup-duplicates.md              # /cleanup-duplicates [--min-size 1M]
│   ├── cleanup-report.md                  # /cleanup-report (generate HTML report)
│   ├── cleanup-restore.md                 # /cleanup-restore
│   ├── cleanup-health.md                  # /cleanup-health (disk health dashboard)
│   ├── cleanup-history.md                 # /cleanup-history
│   ├── cleanup-safe-zones.md              # /cleanup-safe-zones [--add|--remove|--list]
│   └── cleanup-setup.md                   # /cleanup-setup (install hook + check permissions)
│
├── skills/                                # 6 skills
│   ├── storage-analysis/SKILL.md          # Core scan + orchestration
│   ├── quick-cleanup/SKILL.md             # One-command safe cleanup
│   ├── interactive-report/SKILL.md        # HTML report generation
│   ├── restore/SKILL.md                   # Undo/restore from Trash
│   ├── storage-monitor/SKILL.md           # Disk health dashboard
│   └── cleanup-history/SKILL.md           # Track cleanups over time
│
├── agents/                                # 8 agents (1 coordinator + 7 scanners)
│   │  ── GENERAL (default) ──
│   ├── storage-coordinator.md             # Orchestrator + user interaction
│   ├── system-scanner.md                  # Caches, logs, temp, browser, Spotlight, cloud storage
│   ├── user-files-scanner.md              # Downloads, Desktop, Documents, screenshots
│   ├── communications-scanner.md          # Mail attachments + iMessage media
│   ├── backups-snapshots-scanner.md       # iOS backups + Time Machine snapshots
│   ├── app-leftovers-scanner.md           # Orphaned app data, containers, language files
│   │  ── DEVELOPER (--dev flag) ──
│   ├── mobile-dev-scanner.md              # Xcode + Android Studio + Flutter + React Native
│   └── backend-dev-scanner.md             # Docker, package managers, node_modules, build artifacts
│
├── scripts/
│   └── report-server.js                   # Minimal HTTP server for interactive HTML report
│
├── templates/
│   └── report.html                        # Interactive HTML report with selection UI
│
└── references/
    ├── safe-delete-rules.md               # Safety knowledge base
    └── macos-paths.md                     # All known junk locations & commands
```

---

## Agent Architecture — 7 Scanners + 1 Coordinator

### Why 8 agents, not 14

The original plan had 14 scanners. After review:
- **Context window risk**: 14 agent results can exceed context limits during aggregation
- **I/O contention**: 14 parallel filesystem scans thrash the disk
- **Overlap**: Multiple agents scanning the same paths (e.g., Gradle found by both Android and Package Manager agents)
- **Maintenance**: Each agent is a separate file to maintain

**Solution**: Combine related scanners into broader agents that handle their full domain internally. 8 agents is the sweet spot — enough parallelism for speed, small enough to aggregate results.

### GENERAL AGENTS (run by default)

| # | Agent | What It Scans | Typical Recovery |
|---|-------|---------------|------------------|
| 1 | **system-scanner** | ~/Library/Caches (app caches), ~/Library/Logs (>30 days), /tmp, /var/folders, Spotlight index, browser caches (Chrome/Firefox/Safari), cloud storage caches (iCloud/Dropbox/Google Drive/OneDrive), broken symlinks, crash reports | 5-25 GB |
| 2 | **user-files-scanner** | ~/Downloads old files (>30 days: .dmg, .pkg, .zip, .iso), ~/Desktop screenshots, ~/Documents large stale files, creative tool caches (Adobe CC, Final Cut Pro renders, GarageBand sound libraries), media (Music/Podcasts offline), Steam/Epic game data | 10-100 GB |
| 3 | **communications-scanner** | ~/Library/Mail (email attachments, cached messages), ~/Library/Messages/Attachments (iMessage photos, videos, GIFs) | 5-30 GB |
| 4 | **backups-snapshots-scanner** | iOS device backups (~/Library/Application Support/MobileSync/Backup/ — shows device name + date + size), Time Machine local APFS snapshots via `tmutil listlocalsnapshots /` | 10-80 GB |
| 5 | **app-leftovers-scanner** | ~/Library/Application Support (orphaned data from uninstalled apps, cross-referenced against /Applications), ~/Library/Containers (sandboxed leftovers), ~/Library/Group Containers, unused .lproj language files, old .plist files | 2-15 GB |

**General total: 32-250 GB potential recovery**

### DEVELOPER AGENTS (run with `--dev` flag)

| # | Agent | What It Scans | Typical Recovery |
|---|-------|---------------|------------------|
| 6 | **mobile-dev-scanner** | **Xcode**: DerivedData (20-50GB), Archives (warn), CoreSimulator, iOS DeviceSupport, Previews cache. **Android Studio**: caches, logs. **Gradle**: caches, wrapper/dists. **Android SDK**: old platforms, system images (2-5GB each), old build-tools, NDK versions. **AVD emulators**: ~/.android/avd/ (5-15GB each). **Kotlin**: ~/.konan/. **Flutter**: ~/.pub-cache/. **NEVER DELETE**: ~/.android/debug.keystore, ~/.android/adbkey* | 40-200 GB |
| 7 | **backend-dev-scanner** | **Package managers**: npm, pnpm, yarn, cargo, brew, pip, gradle (deduped with mobile), maven, composer, gem, go, bun caches. **Docker**: images (dangling + unused), volumes (warn), build cache via `docker system df -v` (skip if Docker not installed). **Stale project artifacts**: node_modules (inactive >6 months), target/ (Rust), build/ dirs, venv/ (Python), __pycache__. | 10-50 GB |

**Developer total: 50-250 GB additional recovery**

### Agent Coordination Pattern

Agents don't share context directly. Instead:

1. **Scan phase**: Each agent runs independently, writes results to a structured format in its response
2. **Aggregation**: The `storage-coordinator` agent (or the orchestration skill) reads all agent outputs
3. **Deduplication**: Uses path-prefix matching to remove overlaps (e.g., if both mobile-dev and backend-dev report `~/.gradle/caches/`)
4. **Batching**: General agents run first (5 agents). Developer agents run second (2 agents) only if `--dev` flag is set. This prevents context overflow.

---

## Agent Details

### Agent 1: System Scanner (General)
Combines: system-junk + cloud-storage + browser caches + Spotlight

**Paths:**
- `~/Library/Caches/*` — app caches (safe, auto-regenerated)
- `~/Library/Logs/*` — logs older than 30 days (safe)
- Browser: `~/Library/Caches/Google/Chrome/`, Firefox, Safari containers (safe)
- Cloud: `~/Library/Mobile Documents/` (iCloud), `~/.dropbox.cache/`, `~/Library/CloudStorage/` (safe)
- `/tmp/*`, `/var/folders/*` — temp files (safe)
- `/.Spotlight-V100/` — Spotlight index, rebuildable (safe)
- Broken symlinks: `find -L ~ -type l -maxdepth 4` (safe)
- `/Library/Logs/DiagnosticReports/` — old crash reports (safe)

**Technique:** `du -sh` for directory sizes, `find -mtime +30` for old logs.

### Agent 2: User Files Scanner (General)
Combines: user-data + creative-tools + media-entertainment

**Paths:**
- `~/Downloads/` — `find -type f -mtime +30` for old files, flag .dmg/.pkg/.zip/.iso
- `~/Desktop/` — `find -name "Screenshot*"` for screenshot accumulation
- `~/Documents/` — `mdfind -onlyin ~/Documents "kMDItemFSSize > 1073741824"` for files >1GB untouched >6 months
- Adobe: `~/Library/Application Support/Adobe/` (5-50GB)
- Final Cut Pro: `~/Movies/` render files
- GarageBand/Logic: `~/Library/Audio/Apple Loops/` (2-15GB)
- Music/Podcasts: `~/Library/Containers/com.apple.Music/`, `com.apple.podcasts/` offline downloads
- Steam: `~/Library/Application Support/Steam/`
- Fonts: `~/Library/Fonts/` (large families)

**Safety:** Review for all user files. Never auto-delete documents.

### Agent 3: Communications Scanner (General)
**Paths:**
- `~/Library/Mail/` — `du -sh` total + large attachment scan
- `~/Library/Messages/Attachments/` — every iMessage photo/video/GIF
- `~/Library/Containers/com.apple.mail/` — sandboxed Mail data

**Safety:** Review. Mail re-downloadable from server. **iMessage media CANNOT be recovered** — warn prominently.

### Agent 4: Backups & Snapshots Scanner (General)
**Paths:**
- `~/Library/Application Support/MobileSync/Backup/` — parse each backup's `Info.plist` for device name + date + size
- `tmutil listlocalsnapshots /` — enumerate APFS snapshots

**Safety:** Review for iOS backups (show device names). Time Machine snapshots can be thinned. `tmutil deletelocalsnapshots` requires `sudo` — warn user.

### Agent 5: App Leftovers Scanner (General)
**Logic:**
1. List `~/Library/Application Support/` folders
2. Cross-reference against `/Applications/` and `~/Applications/`
3. Orphaned = folder exists but app is NOT installed
4. Same for `~/Library/Containers/`, `~/Library/Group Containers/`
5. Language files: `find /Applications -name "*.lproj" -not -name "en.lproj" -not -name "Base.lproj"` (500MB-2GB)

**Safety:** Review. Some background services use these folders.

### Agent 6: Mobile Dev Scanner (Developer)
**Xcode (40-100 GB):**
- `~/Library/Developer/Xcode/DerivedData/` — safe (always rebuilds)
- `~/Library/Developer/Xcode/Archives/` — warn (intentional keeps)
- `~/Library/Developer/CoreSimulator/` — safe for old iOS versions
- `~/Library/Developer/Xcode/iOS DeviceSupport/` — safe (redownloads)
- Cleanup: `xcrun simctl delete unavailable`

**Android Studio (30-100 GB):**
- `~/Library/Caches/Google/AndroidStudio*` — rebuilds on restart
- `~/Library/Logs/Google/AndroidStudio*` — safe
- `~/.gradle/caches/`, `~/.gradle/wrapper/dists/` — rebuilds on build
- `~/Library/Android/sdk/platforms/` — user picks API levels to keep
- `~/Library/Android/sdk/system-images/` — 2-5GB each, user picks
- `~/Library/Android/sdk/build-tools/` — keep latest, remove old
- `~/Library/Android/sdk/ndk/` — 1-5GB per version
- `~/.android/avd/` — 5-15GB per emulator
- **NEVER DELETE**: `~/.android/debug.keystore`, `~/.android/adbkey*`

**Cross-platform:**
- `~/.konan/` (Kotlin/Native, safe)
- `~/.pub-cache/` (Flutter/Dart, safe)

### Agent 7: Backend Dev Scanner (Developer)
**Package manager caches (all safe — redownload on install):**
- npm (`~/.npm/`), pnpm (`~/.pnpm-store/`), yarn (`~/.yarn/cache/`)
- cargo (`~/.cargo/registry/cache/`, `~/.cargo/git/`)
- brew (`~/Library/Caches/Homebrew/`)
- pip (`~/.cache/pip/`)
- maven (`~/.m2/repository/`), composer (`~/.composer/cache/`)
- gem (`~/.gem/cache/`), go (`~/go/pkg/mod/cache/`), bun (`~/.bun/install/cache/`)

**Docker (skip if not installed):**
- `docker system df -v` for sizes
- Dangling images (safe), build cache (safe)
- Unused volumes (warn — may contain data)

**Stale project artifacts:**
- `node_modules/` in projects with no git activity >6 months
- `target/` (Rust), `build/` dirs, `venv/`/`.venv/` (Python)

**Deduplication note:** If `~/.gradle/caches/` was already reported by mobile-dev-scanner, skip it here.

---

## Slash Commands (12)

| Command | Purpose |
|---------|---------|
| `/cleanup-scan` | Full analysis — 5 general agents by default, add `--dev` for developer agents |
| `/cleanup-execute` | Execute cleanup: `--dry-run` (preview), `--confirm` (delete to Trash), `--from-report` (use HTML selections) |
| `/cleanup-quick` | One-command safe cleanup — only safe categories, single confirmation |
| `/cleanup-disk-usage` | Quick disk overview — capacity, top 20 directories |
| `/cleanup-large-files` | Find files >500MB using fast Spotlight (`mdfind`) queries |
| `/cleanup-duplicates` | Locate duplicate files via size pre-filter + MD5 hash comparison |
| `/cleanup-report` | Generate interactive HTML report, start local server, open in browser |
| `/cleanup-restore` | Restore previously deleted files from Trash by cleanup session |
| `/cleanup-health` | Disk health dashboard — usage %, trend, growth areas, status color |
| `/cleanup-history` | View past cleanups — total freed, timeline, restorable items |
| `/cleanup-safe-zones` | Manage exclusion list: `--add`, `--remove`, `--list` |
| `/cleanup-setup` | First-run setup: check Full Disk Access, install low-disk warning hook |

---

## Skills (6)

### Skill 1: `storage-analysis` — Core Orchestration
Coordinates the scan -> analyze -> report -> execute workflow.

**Scan phase:**
1. Check disk space via `df -h /`
2. Check Full Disk Access (attempt to read `~/Library/Mail/`)
3. Load exclusion list from `.macos-cleanup/config.json`
4. **Batch 1**: Dispatch 5 general agents in parallel
5. **Batch 2** (if `--dev`): Dispatch 2 developer agents
6. Aggregate results, deduplicate by path prefix, classify safety

**Report phase:**
Display categorized results, general first:
```
DISK: 500 GB / 1 TB used (50%)

── GENERAL ──────────────────────────────────────
✓ System caches & logs       8.7 GB   auto-regenerated
✓ Cloud storage caches       2.1 GB   local copies, re-downloadable
⚠ Old Downloads (>30 days)  12.3 GB   47 files: .dmg, .zip, .pkg
⚠ iOS backup (iPhone 12)    28.4 GB   backup from 2024-03
⚠ Time Machine snapshots    15.8 GB   local APFS snapshots
⚠ iMessage media             8.9 GB   photos, videos, GIFs
⚠ Mail attachments           6.2 GB   re-downloadable from server
⚠ Orphaned app data          3.7 GB   5 uninstalled apps
⚠ Desktop screenshots        1.8 GB   342 files
⚠ Adobe CC caches           12.4 GB   render caches

── DEVELOPER (--dev) ────────────────────────────
✓ Xcode DerivedData + Sims  52.3 GB   rebuilds on next build
✓ Android Studio caches      6.2 GB   rebuilds on restart
✓ Gradle caches              8.4 GB   redownloads on build
⚠ Android AVDs (3 devices)  28.0 GB   user picks which to keep
⚠ Android SDK old platforms 12.5 GB   4 old API levels
✓ Package manager caches    10.7 GB   redownloads on install
⚠ Old node_modules          15.3 GB   12 dirs, inactive >6 months
⚠ Docker images (unused)     8.2 GB   3 dangling images
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL RECOVERABLE:         241.0 GB

Run /cleanup-report for interactive HTML selection
Run /cleanup-execute --dry-run to preview deletion
```

**Execute phase:**
1. Show itemized list, Safe batch-selectable, Review individual
2. Move to `~/.Trash` (recoverable 30 days)
3. Log to `.macos-cleanup/deletions-{timestamp}.json`
4. Show before/after summary

### Skill 2: `quick-cleanup` — One-Command Safe Cleanup
- Only targets Safe categories (system caches, browser caches, old logs, package manager caches)
- Skips Review items entirely
- Single confirmation: "Delete 45 GB of auto-regenerated caches? (yes/no)"
- No full scan needed — directly checks known safe paths with `du -sh`

### Skill 3: `interactive-report` — HTML Report with Selection UI
**The browser-safe approach:**

Since browsers can't write directly to the filesystem, we use a minimal local HTTP server:

1. Plugin includes `scripts/report-server.js` — a ~50-line Node.js HTTP server
2. `/cleanup-report` command:
   - Reads scan results from `.macos-cleanup/scan-latest.json`
   - Injects data into `templates/report.html`
   - Starts the local server: `node ${CLAUDE_PLUGIN_ROOT}/scripts/report-server.js`
   - Opens browser: `open http://localhost:3847`
3. User interacts in browser:
   - Checks/unchecks items
   - Sees running total of space to free
   - Clicks "Submit Cleanup Selections"
4. HTML POSTs selections to `http://localhost:3847/submit`
5. Server writes `.macos-cleanup/user-selections.json` and shuts down
6. User runs `/cleanup-execute --from-report` in Claude Code
7. Claude reads the JSON and executes cleanup

**HTML Features:**
- Disk usage bar chart (vanilla JS, no dependencies)
- Expandable/collapsible categories
- Checkboxes with "Select All Safe" button
- Running total of selected space
- Safety legend: Safe (green) | Review (yellow)
- Dark mode (follows system preference)

### Skill 4: `restore` — Undo Cleanup
1. Read deletion logs from `.macos-cleanup/deletions-*.json`
2. Show past sessions with dates and sizes
3. User selects session -> see individual files
4. Restore from `~/.Trash` to original location
5. Verify restore success

### Skill 5: `storage-monitor` — Disk Health
1. `df -h /` for current capacity
2. Read `.macos-cleanup/scan-history.json` for trend
3. Show: usage %, change since last scan, top 5 growth areas
4. Color-coded: Healthy (<70%) | Warning (70-85%) | Critical (>85%)

### Skill 6: `cleanup-history` — Track Cleanups
- Read `.macos-cleanup/deletions-*.json` log files
- Aggregate: total cleanups, total GB freed, categories cleaned, timeline
- Show recent deletions with option to restore

---

## Low-Disk Warning Hook

**Problem:** Hooks cannot be defined inside a plugin — they're global in `~/.claude/settings.json`.

**Solution:** The `/cleanup-setup` command programmatically adds the hook:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "avail=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%'); if [ \"$avail\" -gt 90 ]; then echo 'DISK CRITICALLY LOW: only '$(( 100 - avail ))'% free. Run /cleanup-scan'; elif [ \"$avail\" -gt 80 ]; then echo 'Disk is '$avail'% full. Consider /cleanup-quick'; fi"
          }
        ]
      }
    ]
  }
}
```

The setup command:
1. Reads `~/.claude/settings.json`
2. Checks if our hook already exists
3. Adds it to the SessionStart array if not present
4. Checks if Full Disk Access is available (tries reading `~/Library/Mail/`)
5. Guides user to System Settings if FDA is missing

---

## Safety Guarantees

1. **No permanent deletion** — all files moved to `~/.Trash`
2. **Dry-run by default** — must explicitly pass `--confirm`
3. **Exclusion list** — configurable paths never touched
4. **Hardcoded never-delete:**
   - `~/.ssh`, `~/.gnupg`, `~/.aws` (credentials)
   - `~/.android/debug.keystore`, `~/.android/adbkey*` (Android signing keys)
   - `/System`, `/Applications`, `/Library/System` (SIP-protected)
   - Git-tracked files, active project source code
5. **Deletion logging** — every operation logged with path, size, timestamp
6. **Active file check** — `lsof` before deletion
7. **User confirmation** — itemized preview before any action
8. **Category-aware safety** — Safe = batch delete; Review = individual decision
9. **Sudo warning** — Time Machine cleanup needs elevated privileges
10. **iMessage warning** — Messages media cannot be recovered once deleted
11. **Full Disk Access check** — warns if FDA not granted on first run
12. **SIP awareness** — silently skips system-protected paths

---

## Permissions & System Requirements

### Full Disk Access
Required for scanning:
- `~/Library/Mail/` (email attachments)
- `~/Library/Messages/` (iMessage media)
- Some `~/Library/Containers/` paths

The `/cleanup-setup` command checks this and guides the user through:
```
System Settings -> Privacy & Security -> Full Disk Access -> Add Terminal/iTerm
```

### SIP-Protected Paths (skip silently)
- `/var/vm/sleepimage` — cannot delete, managed by macOS
- `/var/vm/swapfile*` — cannot delete, managed by macOS
- `/Library/Updates/` — may be protected
- `/System/` — fully protected

### Node.js Requirement
The interactive HTML report requires Node.js for the local server (`scripts/report-server.js`). If Node.js is not available, the command falls back to generating a static HTML file opened via `open report.html` with a "Copy Selections" button that puts JSON on the clipboard.

---

## Build Order

### Phase 1 — Infrastructure (3 files)
1. `.claude-plugin/plugin.json`
2. `references/safe-delete-rules.md`
3. `references/macos-paths.md`

### Phase 2 — General Agents (6 files)
4. `agents/storage-coordinator.md`
5. `agents/system-scanner.md`
6. `agents/user-files-scanner.md`
7. `agents/communications-scanner.md`
8. `agents/backups-snapshots-scanner.md`
9. `agents/app-leftovers-scanner.md`

### Phase 3 — Developer Agents (2 files)
10. `agents/mobile-dev-scanner.md`
11. `agents/backend-dev-scanner.md`

### Phase 4 — Commands (12 files)
12-23. All 12 slash commands

### Phase 5 — Skills (6 files)
24. `skills/storage-analysis/SKILL.md`
25. `skills/quick-cleanup/SKILL.md`
26. `skills/interactive-report/SKILL.md`
27. `skills/restore/SKILL.md`
28. `skills/storage-monitor/SKILL.md`
29. `skills/cleanup-history/SKILL.md`

### Phase 6 — Interactive Report (2 files)
30. `templates/report.html`
31. `scripts/report-server.js`

### Component Summary
| Component | Count |
|-----------|-------|
| Plugin manifest | 1 |
| Reference docs | 2 |
| Agents | 8 (1 coordinator + 5 general + 2 developer) |
| Slash commands | 12 |
| Skills | 6 |
| HTML template | 1 |
| Server script | 1 |
| **Total** | **31 files** |

### Scan Modes
| Mode | Flag | Agents | Target |
|------|------|--------|--------|
| Default | (none) | 5 general agents | Everyone |
| Developer | `--dev` | 5 general + 2 developer | Developers |
| Full | `--full` | All 7 scanners + deep duplicate scan | Max coverage |

---

## Verification Plan

1. **Plugin validation**: Run plugin validator — verify `.claude-plugin/plugin.json` is valid, all commands discoverable
2. **Scan test**: `/cleanup-scan` — verify 5 general agents complete, categorized report generated
3. **Dev scan test**: `/cleanup-scan --dev` — verify all 7 agents including Xcode + Android
4. **Dry-run test**: `/cleanup-execute --dry-run` — verify zero files actually deleted
5. **Quick cleanup test**: `/cleanup-quick` — verify only safe categories targeted
6. **Safe-zones test**: Add exclusion, verify scan skips it
7. **HTML report test**: `/cleanup-report` — verify server starts, HTML loads, selections POST correctly
8. **Execution test**: Run on controlled test directory, verify files land in `~/.Trash`
9. **Restore test**: `/cleanup-restore` — verify files restore from Trash
10. **Setup test**: `/cleanup-setup` — verify hook installed in settings.json, FDA check works
11. **Edge cases**: Empty caches, missing directories, no Docker, no Xcode, no Android Studio, no Node.js
12. **Android safety**: Verify `~/.android/debug.keystore` never listed for deletion

---

## Competitive Advantage

| Feature | CleanMyMac | DaisyDisk | Existing Skills | **Our Plugin** |
|---------|-----------|-----------|-----------------|---------------|
| System caches | Yes | No | Yes | **Yes** |
| iOS backups | Yes | No | No | **Yes** |
| Time Machine snapshots | No | No | No | **Yes** |
| iMessage/Mail media | Yes | No | No | **Yes** |
| App leftovers (cross-ref) | Yes | No | Partial | **Yes** |
| Xcode deep scan | No | No | No | **Yes** |
| Android Studio/SDK/AVD | No | No | No | **Yes** |
| Docker cleanup | No | No | Partial | **Yes** |
| Interactive HTML report | No | No | No | **Yes** |
| Restore/undo | Yes | No | No | **Yes** |
| Cloud storage scanning | Yes | No | No | **Yes** |
| Creative tools (Adobe/FCP) | Yes | No | No | **Yes** |
| AI-powered reasoning | No | No | No | **Yes** |
| Natural language Q&A | No | No | No | **Yes** |
| Free / open-source | No ($40/yr) | No ($10) | Yes | **Yes** |
