import { config } from './config.js';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const logLevelMap: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

class Logger {
  private level: LogLevel;
  
  constructor() {
    this.level = logLevelMap[config.logLevel] ?? LogLevel.INFO;
  }
  
  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }
  
  debug(message: string, data?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(this.formatMessage('DEBUG', message));
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }
  
  info(message: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.formatMessage('INFO', message));
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }
  
  warn(message: string, data?: any): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message));
      if (data) {
        console.warn(JSON.stringify(data, null, 2));
      }
    }
  }
  
  error(message: string, error?: any): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message));
      if (error) {
        if (error instanceof Error) {
          console.error(error.stack || error.message);
        } else {
          console.error(JSON.stringify(error, null, 2));
        }
      }
    }
  }
  
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.level = logLevelMap[level] ?? LogLevel.INFO;
  }
}

export const logger = new Logger();