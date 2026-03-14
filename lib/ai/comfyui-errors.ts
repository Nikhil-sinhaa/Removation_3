import fs from 'fs';
import path from 'path';

export interface ErrorLog {
  timestamp: string;
  severity: 'error' | 'warning' | 'info';
  component: 'comfyui' | 'gpu' | 'api' | 'workflow';
  message: string;
  details?: any;
  userId?: string;
  renderId?: string;
}

export class ComfyUIErrorLogger {
  private logFile: string;
  private maxLogSize: number = 10 * 1024 * 1024; // 10MB

  constructor() {
    this.logFile = path.join(process.cwd(), 'logs', 'comfyui-errors.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private rotateLogIfNeeded(): void {
    try {
      if (fs.existsSync(this.logFile) && fs.statSync(this.logFile).size > this.maxLogSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveFile = this.logFile.replace('.log', `-${timestamp}.log`);
        fs.renameSync(this.logFile, archiveFile);
      }
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  log(entry: Omit<ErrorLog, 'timestamp'>): void {
    this.rotateLogIfNeeded();

    const logEntry: ErrorLog = {
      timestamp: new Date().toISOString(),
      ...entry
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }

    // Also log to console for immediate visibility
    const emoji = {
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }[entry.severity];

    console.log(`${emoji} [${entry.component.toUpperCase()}] ${entry.message}`);
  }

  logComfyUIError(message: string, details?: any, renderId?: string): void {
    this.log({
      severity: 'error',
      component: 'comfyui',
      message,
      details,
      renderId
    });
  }

  logGPUError(message: string, details?: any): void {
    log({
      severity: 'error',
      component: 'gpu',
      message,
      details
    });
  }

  logAPIError(message: string, userId?: string, details?: any): void {
    this.log({
      severity: 'error',
      component: 'api',
      message,
      userId,
      details
    });
  }

  logWorkflowError(message: string, renderId?: string, details?: any): void {
    this.log({
      severity: 'error',
      component: 'workflow',
      message,
      renderId,
      details
    });
  }

  getRecentErrors(limit: number = 50): ErrorLog[] {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const content = fs.readFileSync(this.logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      return lines
        .slice(-limit)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Failed to read log file:', error);
      return [];
    }
  }
}

export const comfyUIErrorLogger = new ComfyUIErrorLogger();
