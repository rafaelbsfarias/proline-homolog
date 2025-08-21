/**
 * @fileoverview Logger module for consistent logging across the application.
 *
 * This module provides a configurable logger that can be enabled or disabled
 * via environment variables. It supports different log levels (DEBUG, INFO, WARN, ERROR).
 *
 * It is designed to be used in both client and server-side code.
 *
 * To enable logging, set `NEXT_PUBLIC_ENABLE_LOGGING=true` in your `.env.local` file.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

class Logger implements ILogger {
  private readonly context?: string;
  private readonly isEnabled: boolean;

  constructor(context?: string) {
    this.context = context;
    // NEXT_PUBLIC_ENABLE_LOGGING will be available in the browser and on the server.
    this.isEnabled = process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true';
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.isEnabled) {
      return;
    }

    const timestamp = new Date().toISOString();
    const contextPrefix = this.context ? `[${this.context}]` : '';

    // Using console[level] to call the appropriate console method.
    console[level](`[${timestamp}] [${level.toUpperCase()}]${contextPrefix}`, message, ...args);
  }

  public debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  public info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  public warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  public error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }
}

/**
 * Factory function to create a new logger instance.
 * @param context - Optional context name to be included in log messages.
 * @returns A new ILogger instance.
 */
export const getLogger = (context?: string): ILogger => {
  return new Logger(context);
};