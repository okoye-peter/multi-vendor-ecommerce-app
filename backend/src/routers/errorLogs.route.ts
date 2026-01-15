import express from 'express';
import fs from 'fs';
import path from 'path';

const 
router = express.Router();

router.get('/', (req, res) => {
    const logPath = path.join(process.cwd(), 'logs', 'error.log');

    try {
        if (!fs.existsSync(logPath)) {
            return res.status(404).json({ message: 'No error logs found' });
        }

        const logContent = fs.readFileSync(logPath, 'utf-8');
        const logs = logContent
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            })
            .filter(log => log !== null)
            .reverse(); // Most recent first

        res.json({
            total: logs.length,
            errors: logs
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to read error logs' });
    }
});

router.delete('/', (req, res) => {
    const logPath = path.join(process.cwd(), 'logs', 'error.log');
    
    try {
        if (fs.existsSync(logPath)) {
            fs.writeFileSync(logPath, '');
            res.json({ message: 'Error logs cleared successfully' });
        } else {
            res.status(404).json({ message: 'No error logs found to clear' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to clear error logs' });
    }
});


router.get('/view', (req, res) => {
    const logPath = path.join(process.cwd(), 'logs', 'error.log');
    
    try {
        if (!fs.existsSync(logPath)) {
            return res.send('<h1>No error logs found</h1>');
        }
        
        const logContent = fs.readFileSync(logPath, 'utf-8');
        const logs = logContent
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            })
            .filter(log => log !== null)
            .reverse();
        
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error Logs</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: #f5f5f5; 
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { 
            color: #d32f2f; 
            margin-bottom: 20px; 
            font-size: 28px;
        }
        .stats {
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .error-card {
            background: white;
            padding: 20px;
            margin-bottom: 15px;
            border-radius: 8px;
            border-left: 4px solid #d32f2f;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .error-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            flex-wrap: wrap;
            gap: 10px;
        }
        .error-message {
            font-size: 18px;
            font-weight: 600;
            color: #d32f2f;
        }
        .error-status {
            background: #d32f2f;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 14px;
        }
        .error-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin: 10px 0;
        }
        .detail-item {
            font-size: 14px;
            color: #666;
        }
        .detail-label {
            font-weight: 600;
            color: #333;
        }
        .stack-trace {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            margin-top: 10px;
            overflow-x: auto;
        }
        .stack-trace pre {
            font-family: 'Courier New', monospace;
            font-size: 13px;
            color: #333;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .toggle-stack {
            background: #1976d2;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 10px;
        }
        .toggle-stack:hover {
            background: #1565c0;
        }
        .clear-btn {
            background: #f44336;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .clear-btn:hover {
            background: #d32f2f;
        }
        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚨 Error Logs</h1>
        <div class="stats">
            <strong>Total Errors:</strong> ${logs.length}
        </div>
        <button class="clear-btn" id="clearLogsBtn">Clear All Logs</button>
        ${logs.map((log, index) => `
            <div class="error-card">
                <div class="error-header">
                    <div class="error-message">${log.message || 'Unknown Error'}</div>
                    <div class="error-status">Status: ${log.status || 500}</div>
                </div>
                <div class="error-details">
                    <div class="detail-item">
                        <span class="detail-label">Method:</span> ${log.method || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">URL:</span> ${log.url || 'N/A'}
                    </div>
                    ${log.endpoint ? `
                    <div class="detail-item">
                        <span class="detail-label">Endpoint:</span> ${log.endpoint}
                    </div>
                    ` : ''}
                    <div class="detail-item">
                        <span class="detail-label">IP:</span> ${log.ip || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Time:</span> ${new Date(log.timestamp).toLocaleString()}
                    </div>
                </div>
                ${log.stack ? `
                    <button class="toggle-stack" data-index="${index}">
                        Show Stack Trace
                    </button>
                    <div id="stack-${index}" class="stack-trace hidden">
                        <pre>${log.stack}</pre>
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
    <script src="/errors/view.js"></script>
</body>
</html>
        `;
        
        res.send(html);
    } catch (error) {
        res.status(500).send('<h1>Failed to read error logs</h1>');
    }
});

router.get('/view.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
        // Handle toggle stack traces
        document.addEventListener('DOMContentLoaded', function() {
            const toggleButtons = document.querySelectorAll('.toggle-stack');
            toggleButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const index = this.getAttribute('data-index');
                    const stackEl = document.getElementById('stack-' + index);
                    if (stackEl.classList.contains('hidden')) {
                        stackEl.classList.remove('hidden');
                        this.textContent = 'Hide Stack Trace';
                    } else {
                        stackEl.classList.add('hidden');
                        this.textContent = 'Show Stack Trace';
                    }
                });
            });

            // Handle clear logs button
            const clearBtn = document.getElementById('clearLogsBtn');
            if (clearBtn) {
                clearBtn.addEventListener('click', async function() {
                    if (!confirm('Are you sure you want to clear all error logs? This action cannot be undone.')) {
                        return;
                    }
                    
                    try {
                        const response = await fetch('/errors', {
                            method: 'DELETE'
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                            alert(data.message);
                            location.reload();
                        } else {
                            alert('Error: ' + data.message);
                        }
                    } catch (error) {
                        alert('Failed to clear logs: ' + error.message);
                    }
                });
            }
        });
    `);
});

export default router;
