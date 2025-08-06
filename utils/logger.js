/**
 * Advanced logging utility for Tu Tiên Bot
 * Provides structured logging with different levels and file output
 */

const fs = require('fs').promises;
const path = require('path');

class Logger {
    constructor() {
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        
        this.currentLevel = this.logLevels.INFO;
        this.logDir = './logs';
        this.maxLogFiles = 7; // Keep logs for 7 days
        this.maxLogSize = 10 * 1024 * 1024; // 10MB max per file
        
        // Initialize log directory
        this.initLogDirectory();
        
        // Colors for console output
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            dim: '\x1b[2m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m'
        };
    }

    // Initialize log directory
    async initLogDirectory() {
        try {
            await fs.access(this.logDir);
        } catch {
            await fs.mkdir(this.logDir, { recursive: true });
        }
    }

    // Get timestamp string
    getTimestamp() {
        return new Date().toISOString();
    }

    // Format log message
    formatMessage(level, message, data = null) {
        const timestamp = this.getTimestamp();
        const logEntry = {
            timestamp,
            level,
            message,
            data
        };
        
        return {
            console: this.formatConsoleMessage(timestamp, level, message, data),
            file: JSON.stringify(logEntry)
        };
    }

    // Format console message with colors
    formatConsoleMessage(timestamp, level, message, data) {
        const colors = {
            ERROR: this.colors.red,
            WARN: this.colors.yellow,
            INFO: this.colors.green,
            DEBUG: this.colors.cyan
        };
        
        const color = colors[level] || this.colors.white;
        const resetColor = this.colors.reset;
        
        let formatted = `${this.colors.dim}${timestamp}${resetColor} `;
        formatted += `${color}[${level}]${resetColor} `;
        formatted += `${message}`;
        
        if (data) {
            formatted += `\n${this.colors.dim}${JSON.stringify(data, null, 2)}${resetColor}`;
        }
        
        return formatted;
    }

    // Log with specific level
    async log(level, message, data = null) {
        if (this.logLevels[level] > this.currentLevel) {
            return;
        }
        
        const formatted = this.formatMessage(level, message, data);
        
        // Console output
        console.log(formatted.console);
        
        // File output
        try {
            await this.writeToFile(level, formatted.file);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    // Write to log file
    async writeToFile(level, message) {
        const date = new Date().toISOString().split('T')[0];
        const filename = path.join(this.logDir, `${date}.log`);
        
        try {
            // Check file size and rotate if necessary
            try {
                const stats = await fs.stat(filename);
                if (stats.size > this.maxLogSize) {
                    await this.rotateLogFile(filename);
                }
            } catch {
                // File doesn't exist yet, which is fine
            }
            
            await fs.appendFile(filename, message + '\n', 'utf8');
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    }

    // Rotate log file when it gets too large
    async rotateLogFile(filename) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedName = filename.replace('.log', `-${timestamp}.log`);
        
        try {
            await fs.rename(filename, rotatedName);
        } catch (error) {
            console.error('Error rotating log file:', error);
        }
    }

    // Clean old log files
    async cleanOldLogs() {
        try {
            const files = await fs.readdir(this.logDir);
            const logFiles = files.filter(file => file.endsWith('.log'));
            
            const now = new Date();
            const cutoffDate = new Date(now.getTime() - (this.maxLogFiles * 24 * 60 * 60 * 1000));
            
            for (const file of logFiles) {
                const filePath = path.join(this.logDir, file);
                try {
                    const stats = await fs.stat(filePath);
                    if (stats.mtime < cutoffDate) {
                        await fs.unlink(filePath);
                        this.info(`Deleted old log file: ${file}`);
                    }
                } catch (error) {
                    this.warn(`Error checking log file ${file}:`, error);
                }
            }
        } catch (error) {
            this.error('Error cleaning old logs:', error);
        }
    }

    // Public logging methods
    error(message, data = null) {
        return this.log('ERROR', message, data);
    }

    warn(message, data = null) {
        return this.log('WARN', message, data);
    }

    info(message, data = null) {
        return this.log('INFO', message, data);
    }

    debug(message, data = null) {
        return this.log('DEBUG', message, data);
    }

    // Set log level
    setLevel(level) {
        if (this.logLevels.hasOwnProperty(level)) {
            this.currentLevel = this.logLevels[level];
            this.info(`Log level set to: ${level}`);
        } else {
            this.warn(`Invalid log level: ${level}`);
        }
    }

    // Log Discord events
    discordEvent(eventName, data = null) {
        this.info(`Discord Event: ${eventName}`, data);
    }

    // Log command usage
    commandUsed(commandName, userId, guildId, args = []) {
        this.info(`Command Used: ${commandName}`, {
            userId,
            guildId,
            args
        });
    }

    // Log cultivation events
    cultivationEvent(userId, eventType, data = null) {
        this.info(`Cultivation: ${eventType}`, {
            userId,
            ...data
        });
    }

    // Log PvP events
    pvpEvent(attacker, defender, result) {
        this.info('PvP Battle', {
            attacker,
            defender,
            result
        });
    }

    // Log boss battles
    bossEvent(userId, bossName, result) {
        this.info('Boss Battle', {
            userId,
            bossName,
            result
        });
    }

    // Log errors with stack trace
    errorWithStack(message, error) {
        this.error(message, {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }

    // Performance logging
    performance(operation, duration, data = null) {
        this.debug(`Performance: ${operation} took ${duration}ms`, data);
    }

    // Log system stats
    systemStats(stats) {
        this.info('System Statistics', stats);
    }

    // Create performance timer
    createTimer(name) {
        const start = Date.now();
        return {
            end: (data = null) => {
                const duration = Date.now() - start;
                this.performance(name, duration, data);
                return duration;
            }
        };
    }

    // Log bot startup
    startup(message) {
        const border = '='.repeat(60);
        console.log(`\n${this.colors.green}${border}`);
        console.log(`${this.colors.bright}${this.colors.green}${message}`);
        console.log(`${border}${this.colors.reset}\n`);
        this.info(message);
    }

    // Log bot shutdown
    shutdown(message) {
        const border = '='.repeat(60);
        console.log(`\n${this.colors.red}${border}`);
        console.log(`${this.colors.bright}${this.colors.red}${message}`);
        console.log(`${border}${this.colors.reset}\n`);
        this.info(message);
    }
}

// Create singleton instance
const logger = new Logger();

// Clean old logs on startup
logger.cleanOldLogs().catch(error => {
    console.error('Error cleaning old logs on startup:', error);
});

// Set up daily cleanup
setInterval(() => {
    logger.cleanOldLogs().catch(error => {
        logger.error('Error during scheduled log cleanup:', error);
    });
}, 24 * 60 * 60 * 1000); // Once per day

module.exports = logger;
