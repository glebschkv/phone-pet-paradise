/**
 * Minimal Sentry Client
 *
 * A lightweight (~3KB) Sentry client that sends errors directly to the API
 * without the full SDK overhead. Provides basic error capturing functionality.
 *
 * Full SDK can be lazy-loaded if advanced features are needed.
 */

import { APP_CONFIG as _APP_CONFIG } from './constants';

interface SentryEvent {
  event_id: string;
  timestamp: string;
  platform: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  logger?: string;
  release?: string;
  environment?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: { id?: string; email?: string };
  exception?: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: { frames: Array<{ filename: string; lineno?: number; colno?: number; function?: string }> };
    }>;
  };
  message?: { formatted: string };
}

// Parse DSN to get project details
function parseDsn(dsn: string) {
  const match = dsn.match(/^(https?):\/\/([^@]+)@([^/]+)\/(.+)$/);
  if (!match) return null;
  const [, protocol, publicKey, host, projectId] = match;
  return { protocol, publicKey, host, projectId };
}

// Generate a UUID v4
function generateEventId(): string {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Parse error stack into frames
function parseStack(stack?: string): Array<{ filename: string; lineno?: number; colno?: number; function?: string }> {
  if (!stack) return [];

  const frames: Array<{ filename: string; lineno?: number; colno?: number; function?: string }> = [];
  const lines = stack.split('\n').slice(1); // Skip the first line (error message)

  for (const line of lines) {
    // Chrome/Safari format: "    at functionName (file:line:col)"
    const chromeMatch = line.match(/^\s*at\s+(?:(.+?)\s+)?\(?(.+?):(\d+):(\d+)\)?$/);
    if (chromeMatch) {
      frames.push({
        function: chromeMatch[1] || '<anonymous>',
        filename: chromeMatch[2],
        lineno: parseInt(chromeMatch[3], 10),
        colno: parseInt(chromeMatch[4], 10),
      });
      continue;
    }

    // Firefox format: "functionName@file:line:col"
    const firefoxMatch = line.match(/^(.+?)@(.+?):(\d+):(\d+)$/);
    if (firefoxMatch) {
      frames.push({
        function: firefoxMatch[1] || '<anonymous>',
        filename: firefoxMatch[2],
        lineno: parseInt(firefoxMatch[3], 10),
        colno: parseInt(firefoxMatch[4], 10),
      });
    }
  }

  // Sentry expects frames in reverse order (most recent last)
  return frames.reverse();
}

// Minimal Sentry client
class MinimalSentryClient {
  private dsnParsed: ReturnType<typeof parseDsn> = null;
  private tags: Record<string, string> = {};
  private user: { id?: string; email?: string } | null = null;
  private release: string | null = null;
  private environment: string | null = null;
  private beforeSend: ((event: SentryEvent) => SentryEvent | null) | null = null;

  init(options: {
    dsn: string;
    release?: string;
    environment?: string;
    beforeSend?: (event: SentryEvent) => SentryEvent | null;
  }) {
    this.dsnParsed = parseDsn(options.dsn);
    this.dsnParsed = parseDsn(options.dsn);
    this.release = options.release || null;
    this.environment = options.environment || null;
    this.beforeSend = options.beforeSend || null;

    if (!this.dsnParsed) {
      console.warn('[MinimalSentry] Invalid DSN');
    }
  }

  setTag(key: string, value: string) {
    this.tags[key] = value;
  }

  setUser(user: { id?: string; email?: string } | null) {
    this.user = user;
  }

  addBreadcrumb(_breadcrumb: { message: string; category: string; data?: Record<string, unknown> }) {
    // Breadcrumbs not supported in minimal client
    // Could be implemented with a simple array if needed
  }

  captureException(error: Error, extra?: Record<string, unknown>): string | null {
    if (!this.dsnParsed) return null;

    const eventId = generateEventId();
    const event: SentryEvent = {
      event_id: eventId,
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      level: 'error',
      release: this.release || undefined,
      environment: this.environment || undefined,
      tags: { ...this.tags },
      extra: extra || undefined,
      user: this.user || undefined,
      exception: {
        values: [
          {
            type: error.name || 'Error',
            value: error.message,
            stacktrace: { frames: parseStack(error.stack) },
          },
        ],
      },
    };

    this.sendEvent(event);
    return eventId;
  }

  captureMessage(message: string, options?: { level?: 'warning' | 'info'; extra?: Record<string, unknown> }): string | null {
    if (!this.dsnParsed) return null;

    const eventId = generateEventId();
    const event: SentryEvent = {
      event_id: eventId,
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      level: options?.level || 'info',
      release: this.release || undefined,
      environment: this.environment || undefined,
      tags: { ...this.tags },
      extra: options?.extra || undefined,
      user: this.user || undefined,
      message: { formatted: message },
    };

    this.sendEvent(event);
    return eventId;
  }

  private async sendEvent(event: SentryEvent) {
    if (!this.dsnParsed) return;

    // Apply beforeSend filter
    let processedEvent: SentryEvent | null = event;
    if (this.beforeSend) {
      try {
        processedEvent = this.beforeSend(event);
      } catch {
        processedEvent = event;
      }
    }
    if (!processedEvent) return;

    const { protocol, publicKey, host, projectId } = this.dsnParsed;
    const url = `${protocol}://${host}/api/${projectId}/store/?sentry_key=${publicKey}&sentry_version=7`;

    try {
      // Use sendBeacon if available for reliability, otherwise fetch
      const payload = JSON.stringify(processedEvent);

      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, payload);
      } else {
        fetch(url, {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        }).catch(() => {
          // Silently fail - error reporting shouldn't break the app
        });
      }
    } catch {
      // Silently fail
    }
  }
}

// Export singleton instance
export const minimalSentry = new MinimalSentryClient();

// Integration detection helpers
export const inboundFiltersIntegration = () => ({});
export const functionToStringIntegration = () => ({});
export const linkedErrorsIntegration = () => ({});
export const dedupeIntegration = () => ({});
