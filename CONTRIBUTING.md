# Contributing to macOS Storage Cleanup

Thank you for your interest in contributing! This guide covers how to set up for development, our conventions, and the PR process.

## Getting Started

### Development Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/macos-storage-cleanup.git
   cd macos-storage-cleanup
   ```

2. **Install the plugin locally:**
   ```bash
   claude plugin add .
   ```

3. **Run setup:**
   ```
   /cleanup-setup
   ```

4. **Verify everything works:**
   ```
   /cleanup-disk-usage
   /cleanup-scan
   ```

### Project Structure

```
FileCleanUp/
  .claude-plugin/plugin.json   # Plugin manifest
  commands/                    # 12 slash commands (entry points)
  skills/                      # 6 skills (workflow orchestration)
  agents/                      # 8 agents (parallel scanners)
  scripts/report-server.js     # HTML report server (Node.js)
  templates/report.html        # Interactive report UI
  references/                  # Safety rules + macOS path database
```

### How the Architecture Works

**Commands** are user entry points (slash commands). They invoke **Skills** for orchestration logic. Skills dispatch **Agents** for parallel filesystem scanning. This three-layer separation keeps each component focused and testable.

## What to Contribute

### Good First Issues

- Add a new path to `references/macos-paths.md` for an app that accumulates cache
- Improve the HTML report styling or add accessibility features
- Add a new package manager cache path to `agents/backend-dev-scanner.md`
- Fix typos or improve documentation clarity

### Feature Contributions

- New scanner agents (e.g., gaming platforms, virtualization tools)
- Additional cleanup commands
- Improved duplicate detection algorithms
- Better size estimation for Time Machine snapshots

### What We're NOT Looking For

- Destructive deletion methods (we always use `mv` to Trash)
- Network-dependent features (this plugin works fully offline)
- Features requiring root/admin privileges by default

## Development Guidelines

### Adding a New Scanner Agent

1. Create `agents/your-scanner.md` with proper frontmatter:
   ```yaml
   ---
   name: Your Scanner
   description: What this scanner finds
   tools: [Bash, Read, Glob, Grep]
   color: "#HEX_COLOR"
   ---
   ```

2. Follow the existing pattern:
   - Check if the tool is installed before scanning
   - Use `du -sh` for directory sizes
   - Classify items as SAFE or REVIEW
   - Return structured JSON format
   - Never touch paths in the never-delete list

3. Add the scanner to `agents/storage-coordinator.md` dispatch list
4. Update `references/macos-paths.md` with new paths
5. Update `references/safe-delete-rules.md` if adding new safety classifications

### Adding a New Command

1. Create `commands/cleanup-yourcommand.md` with frontmatter:
   ```yaml
   ---
   name: cleanup-yourcommand
   description: "What this command does"
   ---
   ```

2. Register it in `.claude-plugin/plugin.json` commands array

3. If the command needs orchestration logic, create a corresponding skill in `skills/`

### Modifying the HTML Report

The report at `templates/report.html` is a single self-contained file:
- No external dependencies (all CSS/JS inline)
- Uses `textContent` instead of `innerHTML` (XSS-safe)
- Supports dark mode via `prefers-color-scheme`
- Must remain responsive (test at 320px width)

### Modifying the Report Server

`scripts/report-server.js` uses only Node.js built-in modules:
- No npm dependencies allowed (zero-install)
- Must bind to `127.0.0.1` only (security requirement)
- Must validate POST payloads
- Must auto-shutdown after receiving selections

## Safety Rules

**These are non-negotiable:**

1. Never use `rm` — always `mv` to `~/.Trash/`
2. Never delete paths in the hardcoded never-delete list
3. Always classify items as SAFE or REVIEW
4. REVIEW items must always require individual user approval
5. Always log deletions to `~/.macos-cleanup/deletions-*.json`
6. Never send data to external servers
7. The report server must only bind to localhost

## Code Style

### Markdown Files (Commands, Agents, Skills)
- Use YAML frontmatter with consistent fields
- Clear, step-by-step instructions
- Include exact bash commands (not pseudocode)
- Document safety classification for every path

### JavaScript (report-server.js, report.html)
- No external dependencies
- Use `const`/`let`, never `var`
- Handle errors gracefully with user-friendly messages
- Add comments only where logic isn't self-evident

### Reference Docs
- Group paths by category
- Mark each path with safety level (SAFE/REVIEW)
- Include the shell command to check the path
- Note typical size ranges

## Pull Request Process

1. **Branch naming:** `feature/description`, `fix/description`, or `docs/description`

2. **Before submitting:**
   - Test your changes with `/cleanup-scan` and `/cleanup-execute --dry-run`
   - Verify no paths in the never-delete list are affected
   - Check that `plugin.json` is valid JSON
   - If you modified the HTML report, test in both light and dark mode
   - If you modified the server, test with `node scripts/report-server.js`

3. **PR description should include:**
   - What the change does
   - Why it's needed
   - How you tested it
   - Any new paths added and their safety classification

4. **Review criteria:**
   - Safety rules are followed
   - No external dependencies added
   - No data sent to external servers
   - Cross-platform paths are macOS-only
   - Documentation is updated

## Questions?

Open a [GitHub Discussion](https://github.com/santhoshj/macos-storage-cleanup/discussions) or file an issue.
