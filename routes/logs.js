import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const join = path.join;

// Ensure logs directory exists
const LOGS_DIR = join(process.cwd(), 'logs');
const CLIENT_LOGS_FILE = join(LOGS_DIR, 'client.log');

// In-memory storage for UI logs
const uiLogs = [];
const MAX_UI_LOGS = 1000; // Maximum number of UI logs to keep in memory

// Create logs directory if it doesn't exist
async function ensureLogsDir() {
    try {
        await fs.mkdir(LOGS_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating logs directory:', error);
    }
}

// Initialize logs directory
ensureLogsDir().catch(console.error);

/**
 * Post an error to UI logs for display on screen
 * POST /api/logs/error
 * Body: { message: string, details: object, source: string }
 */
router.post('/error', express.json(), (req, res) => {
    try {
        const { message, details = {}, source = 'server' } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Error message is required' 
            });
        }

        const timestamp = new Date().toISOString();
        const logEntry = {
            id: uuidv4(),
            timestamp,
            level: 'error',
            message,
            data: {
                ...details,
                source,
                type: 'error'
            },
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        // Add to in-memory logs
        uiLogs.push(logEntry);
        
        // Keep only the most recent logs
        if (uiLogs.length > MAX_UI_LOGS) {
            uiLogs.shift(); // Remove oldest log
        }

        // Also log to console for debugging
        console.error(`[UI ERROR] ${source}: ${message}`, details);

        res.json({ 
            success: true, 
            message: 'Error logged to UI',
            id: logEntry.id
        });

    } catch (error) {
        console.error('Error processing error log entry:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process error log entry',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Post a warning to UI logs for display on screen
 * POST /api/logs/warning
 * Body: { message: string, details: object, source: string }
 */
router.post('/warning', express.json(), (req, res) => {
    try {
        const { message, details = {}, source = 'server' } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Warning message is required' 
            });
        }

        const timestamp = new Date().toISOString();
        const logEntry = {
            id: uuidv4(),
            timestamp,
            level: 'warn',
            message,
            data: {
                ...details,
                source,
                type: 'warning'
            },
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        // Add to in-memory logs
        uiLogs.push(logEntry);
        
        // Keep only the most recent logs
        if (uiLogs.length > MAX_UI_LOGS) {
            uiLogs.shift(); // Remove oldest log
        }

        // Also log to console for debugging
        console.warn(`[UI WARNING] ${source}: ${message}`, details);

        res.json({ 
            success: true, 
            message: 'Warning logged to UI',
            id: logEntry.id
        });

    } catch (error) {
        console.error('Error processing warning log entry:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process warning log entry',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Post an info message to UI logs for display on screen
 * POST /api/logs/info
 * Body: { message: string, details: object, source: string }
 */
router.post('/info', express.json(), (req, res) => {
    try {
        const { message, details = {}, source = 'server' } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Info message is required' 
            });
        }

        const timestamp = new Date().toISOString();
        const logEntry = {
            id: uuidv4(),
            timestamp,
            level: 'info',
            message,
            data: {
                ...details,
                source,
                type: 'info'
            },
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        // Add to in-memory logs
        uiLogs.push(logEntry);
        
        // Keep only the most recent logs
        if (uiLogs.length > MAX_UI_LOGS) {
            uiLogs.shift(); // Remove oldest log
        }

        // Also log to console for debugging
        console.info(`[UI INFO] ${source}: ${message}`, details);

        res.json({ 
            success: true, 
            message: 'Info logged to UI',
            id: logEntry.id
        });

    } catch (error) {
        console.error('Error processing info log entry:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process info log entry',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Log a UI message (in-memory)
 * POST /api/logs/ui
 * Body: { level: string, message: string, data: object }
 */
router.post('/ui', express.json(), (req, res) => {
    try {
        const { level = 'info', message, data = {} } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Message is required' 
            });
        }

        const timestamp = new Date().toISOString();
        const logEntry = {
            id: uuidv4(),
            timestamp,
            level,
            message,
            data,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        // Add to in-memory logs
        uiLogs.push(logEntry);
        
        // Keep only the most recent logs
        if (uiLogs.length > MAX_UI_LOGS) {
            uiLogs.shift(); // Remove oldest log
        }

        res.json({ 
            success: true, 
            message: 'UI log entry created',
            id: logEntry.id
        });

    } catch (error) {
        console.error('Error processing UI log entry:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process UI log entry',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Clear UI logs (in-memory)
 * DELETE /api/logs/ui
 */
router.delete('/ui', (req, res) => {
    try {
        uiLogs.length = 0;
        res.json({ success: true, message: 'UI logs cleared' });
    } catch (error) {
        console.error('Error clearing UI logs:', error);
        res.status(500).json({ success: false, error: 'Failed to clear UI logs', details: error.message });
    }
});

/**
 * Get UI logs (in-memory)
 * GET /api/logs/ui
 * Query params: 
 *   - limit: number of logs to return (default: 100)
 *   - level: filter by log level (e.g., 'error', 'warn', 'info')
 */
router.get('/ui', (req, res) => {
    try {
        const { limit = 100, level } = req.query;
        const limitNum = Math.min(parseInt(limit, 10) || 100, 1000);
        
        // Filter logs by level if specified
        let logs = [...uiLogs];
        if (level) {
            logs = logs.filter(log => log.level === level);
        }
        
        // Get most recent logs up to the limit
        const result = logs.slice(-limitNum).reverse();
        
        res.json({
            success: true,
            count: result.length,
            total: uiLogs.length,
            logs: result
        });
        
    } catch (error) {
        console.error('Error retrieving UI logs:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to retrieve UI logs',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Log a message to disk
 * POST /api/logs/disk
 * Body: { level: string, message: string, data: object }
 */
router.post('/disk', express.json(), async (req, res) => {
    try {
        const { level = 'info', message, data = {} } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Message is required' 
            });
        }

        const timestamp = new Date().toISOString();
        const logEntry = {
            id: uuidv4(),
            timestamp,
            level,
            message,
            data,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        // Write to log file
        await fs.appendFile(
            CLIENT_LOGS_FILE, 
            JSON.stringify(logEntry) + '\n',
            'utf8'
        );

        res.json({ 
            success: true, 
            message: 'Disk log entry created',
            id: logEntry.id
        });

    } catch (error) {
        console.error('Error processing disk log entry:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process disk log entry',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Get logs from disk
 * GET /api/logs/disk
 * Query params: 
 *   - limit: number of logs to return (default: 100)
 *   - level: filter by log level (e.g., 'error', 'warn', 'info')
 */
router.get('/disk', async (req, res) => {
    try {
        const { limit = 100, level } = req.query;
        const limitNum = Math.min(parseInt(limit, 10) || 100, 1000);
        
        try {
            const data = await fs.readFile(CLIENT_LOGS_FILE, 'utf8');
            let logs = data
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (e) {
                        console.warn('Failed to parse log entry:', line);
                        return null;
                    }
                })
                .filter(log => log !== null);
            
            // Filter by level if specified
            if (level) {
                logs = logs.filter(log => log.level === level);
            }
            
            // Apply limit and reverse to get most recent first
            const result = logs.slice(-limitNum).reverse();
            
            res.json({
                success: true,
                count: result.length,
                total: logs.length,
                logs: result
            });
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Log file doesn't exist yet, return empty array
                return res.json({
                    success: true,
                    count: 0,
                    total: 0,
                    logs: []
                });
            }
            throw error;
        }
        
    } catch (error) {
        console.error('Error retrieving disk logs:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to retrieve disk logs',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Backward compatibility endpoints
router.post('/', express.json(), async (req, res) => {
    console.warn('Deprecated: Using legacy log endpoint. Please update to /api/logs/ui or /api/logs/disk');
    // Duplicate disk endpoint logic for backward compatibility
    try {
        const { level = 'info', message, data = {} } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Message is required' 
            });
        }

        const timestamp = new Date().toISOString();
        const logEntry = {
            id: uuidv4(),
            timestamp,
            level,
            message,
            data,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        // Write to log file
        await fs.appendFile(
            CLIENT_LOGS_FILE, 
            JSON.stringify(logEntry) + '\n',
            'utf8'
        );

        res.json({ 
            success: true, 
            message: 'Disk log entry created',
            id: logEntry.id
        });

    } catch (error) {
        console.error('Error processing disk log entry:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process disk log entry',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.get('/', async (req, res) => {
    console.warn('Deprecated: Using legacy log endpoint. Please update to /api/logs/ui or /api/logs/disk');
    // Duplicate disk endpoint logic for backward compatibility
    try {
        const { limit = 100, level } = req.query;
        const limitNum = Math.min(parseInt(limit, 10) || 100, 1000);
        
        try {
            const data = await fs.readFile(CLIENT_LOGS_FILE, 'utf8');
            let logs = data
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (e) {
                        console.warn('Failed to parse log entry:', line);
                        return null;
                    }
                })
                .filter(log => log !== null);
            
            // Filter by level if specified
            if (level) {
                logs = logs.filter(log => log.level === level);
            }
            
            // Apply limit and reverse to get most recent first
            const result = logs.slice(-limitNum).reverse();
            
            res.json({
                success: true,
                count: result.length,
                total: logs.length,
                logs: result
            });
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Log file doesn't exist yet, return empty array
                return res.json({
                    success: true,
                    count: 0,
                    total: 0,
                    logs: []
                });
            }
            throw error;
        }
        
    } catch (error) {
        console.error('Error retrieving disk logs:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to retrieve disk logs',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;
