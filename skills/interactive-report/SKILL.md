---
name: Interactive Report
description: "Generate an interactive HTML report with category breakdown, checkboxes, and cleanup selection UI"
tools: [Bash, Read, Write]
---

# Interactive Report

## Prerequisites

- Scan results must exist at `~/.macos-cleanup/scan-latest.json`
- If not found, tell user to run `/cleanup-scan` first

## Steps

1. Read scan results from `~/.macos-cleanup/scan-latest.json`
2. Read HTML template from `${CLAUDE_PLUGIN_ROOT}/templates/report.html`
3. Inject scan data into the template by replacing the `__SCAN_DATA__` placeholder with the JSON-stringified scan results
4. Write the completed HTML to `~/.macos-cleanup/report.html`

## Serving Strategy

**If Node.js is available** (`command -v node`):
1. Start the report server: `node ${CLAUDE_PLUGIN_ROOT}/scripts/report-server.js &`
2. Wait 1 second for server to start
3. Open browser: `open http://localhost:3847`
4. Tell user: "Select items to clean up in your browser, then click Submit."
5. The server will write selections to `~/.macos-cleanup/user-selections.json` and shut down
6. Tell user to run `/cleanup-execute --from-report` afterward

**If Node.js is NOT available**:
1. Write the HTML directly to `~/.macos-cleanup/report.html`
2. Open with: `open ~/.macos-cleanup/report.html`
3. The static HTML includes a "Copy Selections to Clipboard" button
4. Tell user to paste selections and run `/cleanup-execute`
