#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CLEANUP_DIR = path.join(os.homedir(), '.macos-cleanup');
const REPORT_PATH = path.join(CLEANUP_DIR, 'report.html');
const SCAN_DATA_PATH = path.join(CLEANUP_DIR, 'scan-latest.json');
const SELECTIONS_PATH = path.join(CLEANUP_DIR, 'user-selections.json');

const PORT_START = 3847;
const MAX_PORTS_TO_TRY = 3;

function isLocalhost(host) {
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
}

function handleGet(req, res) {
    if (req.url === '/') {
        // Serve the report HTML
        if (!fs.existsSync(REPORT_PATH)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Error: report.html not found at ' + REPORT_PATH + '. Please ensure the cleanup scan has been configured.');
            return;
        }

        try {
            let html = fs.readFileSync(REPORT_PATH, 'utf-8');

            // Load scan data
            let scanData = {};
            if (fs.existsSync(SCAN_DATA_PATH)) {
                const rawData = fs.readFileSync(SCAN_DATA_PATH, 'utf-8');
                scanData = JSON.parse(rawData);
            }

            // Replace placeholder with actual data
            html = html.replace('__SCAN_DATA__', JSON.stringify(scanData));

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error reading report: ' + err.message);
        }
    } else if (req.url === '/data') {
        // Serve scan data as JSON
        if (!fs.existsSync(SCAN_DATA_PATH)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Scan data not found' }));
            return;
        }

        try {
            const data = fs.readFileSync(SCAN_DATA_PATH, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
}

function handlePost(req, res) {
    if (req.url === '/submit') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
            if (body.length > 10 * 1024 * 1024) {
                req.connection.destroy();
            }
        });

        req.on('end', () => {
            try {
                const selections = JSON.parse(body);

                if (!Array.isArray(selections)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Selections must be an array' }));
                    return;
                }

                // Calculate total size
                let totalBytes = 0;
                selections.forEach(item => {
                    totalBytes += item.size_bytes || 0;
                });

                // Ensure directory exists
                if (!fs.existsSync(CLEANUP_DIR)) {
                    fs.mkdirSync(CLEANUP_DIR, { recursive: true });
                }

                // Write selections to file
                fs.writeFileSync(SELECTIONS_PATH, JSON.stringify(selections, null, 2));

                const totalSize = formatBytes(totalBytes);
                const itemCount = selections.length;
                console.log(`\nSelections received: ${itemCount} item${itemCount !== 1 ? 's' : ''} selected (${totalSize})`);
                console.log(`Saved to ${SELECTIONS_PATH}`);
                console.log('Server shutting down...');

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'ok',
                    message: 'Selections saved',
                    items_count: itemCount,
                    total_bytes: totalBytes
                }));

                // Graceful shutdown after response completes
                setTimeout(() => {
                    process.exit(0);
                }, 2000);
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON: ' + err.message }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

const server = http.createServer((req, res) => {
    // Check for localhost access
    const host = req.headers.host?.split(':')[0];
    if (!isLocalhost(host)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Access denied. This server only accepts localhost connections.');
        return;
    }

    // Set CORS headers for localhost
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:' + req.socket.localPort);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'GET') {
        handleGet(req, res);
    } else if (req.method === 'POST') {
        handlePost(req, res);
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method not allowed');
    }
});

function startServer(port) {
    server.listen(port, '127.0.0.1', () => {
        console.log('\nmacOS Storage Cleanup — Report Server');
        console.log('Serving at http://localhost:' + port);
        console.log('Press Ctrl+C to stop\n');
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            const nextPort = port + 1;
            if (nextPort - PORT_START < MAX_PORTS_TO_TRY) {
                console.log(`Port ${port} in use, trying ${nextPort}...`);
                startServer(nextPort);
            } else {
                console.error(`Could not find available port (tried ports ${PORT_START}-${nextPort - 1})`);
                process.exit(1);
            }
        } else {
            console.error('Server error:', err.message);
            process.exit(1);
        }
    });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    server.close(() => {
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\nShutting down...');
    server.close(() => {
        process.exit(0);
    });
});

// Start the server
startServer(PORT_START);
