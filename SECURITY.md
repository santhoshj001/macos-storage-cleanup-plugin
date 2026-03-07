# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | Yes                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public GitHub issue** for security vulnerabilities
2. Email the maintainer directly or use GitHub's private vulnerability reporting
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a timeline for a fix.

## Security Design

This plugin handles filesystem operations on user machines. Our security model:

### Deletion Safety
- **No permanent deletion**: All file operations use `mv` to `~/.Trash/`, never `rm`
- **Dry-run by default**: `/cleanup-execute` defaults to `--dry-run` mode
- **Session logging**: Every deletion is logged to `~/.macos-cleanup/deletions-*.json` for auditability and restoration

### Protected Paths (Never Deleted)
- `~/.ssh/`, `~/.gnupg/`, `~/.aws/` — credential stores
- `~/.android/debug.keystore`, `~/.android/adbkey*` — Android signing keys
- `~/Library/Keychains/` — macOS keychain
- `/System/`, `/Applications/` — SIP-protected system paths
- `.env`, `.env.*` — environment variable files
- Git-tracked files — checked via `git ls-files`

### Network Security
- The report server (`scripts/report-server.js`) binds exclusively to `127.0.0.1`
- Host header validation rejects non-localhost requests
- CORS restricted to localhost origin
- POST payload limited to 10MB
- Server auto-shuts down after receiving selections

### Filesystem Access
- Scanner agents only read filesystem metadata (sizes, dates, paths)
- No data is transmitted externally — all processing is local
- Full Disk Access (FDA) is optional; the plugin degrades gracefully without it

### What This Plugin Does NOT Do
- Does not send any data to external servers
- Does not require network access (except localhost for the HTML report)
- Does not modify system files or configurations (except `~/.claude/settings.json` for the optional hook)
- Does not run with elevated privileges (except Time Machine snapshot deletion, which requires explicit `sudo`)
