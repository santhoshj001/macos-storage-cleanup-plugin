---
name: Backend Dev Scanner
description: Scans Docker images, package manager caches (npm, cargo, pip, etc.), and stale project build artifacts
tools: [Bash, Read, Glob, Grep]
color: "#2C3E50"
---

# Backend Dev Scanner

Developer-only scanner (runs when `--dev` flag is present). Scans package manager caches, Docker, and stale project artifacts.

## Package Manager Caches (ALL SAFE)
For each package manager, check if directory exists and measure with `du -sh`. All are safe to regenerate:

1. **npm**: `~/.npm/`
   - Re-downloaded on `npm install`
2. **pnpm**: `~/.pnpm-store/`
   - Re-downloaded on `pnpm install`
3. **yarn**: `~/.yarn/cache/` and `~/.cache/yarn/`
   - Re-downloaded on `yarn install`
4. **Cargo** (Rust):
   - Registry cache: `~/.cargo/registry/cache/`
   - Git cache: `~/.cargo/git/`
   - Re-downloaded on `cargo build`
5. **Homebrew**: `~/Library/Caches/Homebrew/`
   - Re-downloaded on install/upgrade
6. **pip** (Python):
   - `~/.cache/pip/`
   - `~/Library/Caches/pip/`
   - Re-downloaded on `pip install`
7. **Maven**: `~/.m2/repository/`
   - Re-downloaded on build
8. **Composer** (PHP): `~/.composer/cache/`
   - Re-downloaded on `composer install`
9. **gem** (Ruby): `~/.gem/cache/`
   - Re-downloaded on `gem install`
10. **go**: `~/go/pkg/mod/cache/`
    - Re-downloaded on `go get`
11. **bun**: `~/.bun/install/cache/`
    - Re-downloaded on `bun install`
12. **CocoaPods** (Objective-C/Swift):
    - `~/Library/Caches/CocoaPods/`
    - Re-downloaded on `pod install`

## Docker
1. Check if Docker installed: `command -v docker 2>/dev/null`
2. If not installed, skip all Docker sections
3. **System Overview**:
   - Command: `docker system df -v 2>/dev/null`
4. **Dangling Images** (SAFE):
   - These are untagged images from interrupted builds
   - Safe to remove: `docker image prune -f`
5. **Build Cache** (SAFE):
   - Safe to remove: `docker builder prune -f`
   - Will rebuild on next `docker build`
6. **Unused Volumes** (REVIEW):
   - List unused volumes
   - Warning: May contain data — user decides
   - Command to list: `docker volume ls -f dangling=true`

## Stale Project Artifacts (REVIEW)
These are build outputs in active projects. Check if project is stale before flagging:

1. **node_modules** (JavaScript/Node.js):
   - Find: `find ~ -name "node_modules" -type d -maxdepth 5 -not -path "*/.*"`
   - For each match, check if parent directory is a git repo:
     - Command: `git -C <parent_dir> log -1 --format=%ct 2>/dev/null`
     - If no output, not a git repo — skip
     - If output exists, convert timestamp and check if >6 months old
     - If >6 months, flag as stale
   - Safety: REVIEW (user confirms project is abandoned)

2. **Rust target/** (Rust):
   - Find: `find ~ -name "target" -type d -maxdepth 5`
   - For each match, verify parent has `Cargo.toml`
   - If found and >6 months old git activity, flag as stale
   - Safety: REVIEW

3. **Python venv** (Python Virtual Environments):
   - Find: `find ~ \( -name "venv" -o -name ".venv" \) -type d -maxdepth 5`
   - Safety: REVIEW (user may have custom venvs)

4. **__pycache__** (Python cache):
   - Find: `find ~ -name "__pycache__" -type d -maxdepth 5`
   - Safety: SAFE (rebuilt on next Python run)

## Report Format
Return JSON array with objects containing:

**Cache Item:**
```json
{
  "path": "~/.npm",
  "size_bytes": 2147483648,
  "size_human": "2.0 GB",
  "category": "npm Cache",
  "safety": "safe",
  "description": "npm package cache (re-downloaded on npm install)"
}
```

**Docker Item:**
```json
{
  "path": "Docker System",
  "size_bytes": 5368709120,
  "size_human": "5.0 GB",
  "category": "Docker Dangling Images",
  "safety": "safe",
  "description": "12 untagged Docker images from interrupted builds"
}
```

**Stale Project:**
```json
{
  "path": "/Users/username/old-project/node_modules",
  "size_bytes": 1610612736,
  "size_human": "1.5 GB",
  "category": "Stale node_modules",
  "safety": "review",
  "description": "node_modules from project with no git activity since Nov 2025"
}
```

## Deduplication
- If a path was already reported by mobile-dev-scanner (e.g., `~/.gradle/caches/`), skip it
- Check `~/.macos-cleanup/scan-latest.json` to avoid duplicates
- Only report each path once across all scanners

## Important
- All cache items are SAFE
- All project artifacts are REVIEW (requires user confirmation)
- Skip paths that don't exist
- Docker scanning requires Docker to be installed
