/**
 * Debug logger that persists to localStorage across page refreshes
 */

const DEBUG_LOG_KEY = 'debug_autosave_logs';
const MAX_LOG_ENTRIES = 100;

export const debugLog = {
  /**
   * Add a debug log entry (also logs to console)
   */
  log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      message,
      data: data !== undefined ? JSON.stringify(data, null, 2) : undefined,
    };

    // Log to console
    if (data !== undefined) {
      console.log(`[DEBUG ${timestamp}] ${message}`, data);
    } else {
      console.log(`[DEBUG ${timestamp}] ${message}`);
    }

    // Persist to localStorage
    try {
      const existing = this.getAll();
      existing.push(entry);

      // Keep only last MAX_LOG_ENTRIES
      const trimmed = existing.slice(-MAX_LOG_ENTRIES);

      localStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to write debug log:', error);
    }
  },

  /**
   * Get all debug logs
   */
  getAll(): Array<{ timestamp: string; message: string; data?: string }> {
    try {
      const raw = localStorage.getItem(DEBUG_LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error('Failed to read debug logs:', error);
      return [];
    }
  },

  /**
   * Print all logs to console
   */
  print() {
    const logs = this.getAll();
    console.log('=== DEBUG LOGS ===');
    logs.forEach((entry, index) => {
      console.log(`[${index}] ${entry.timestamp}: ${entry.message}`);
      if (entry.data) {
        console.log('  Data:', entry.data);
      }
    });
    console.log('=== END DEBUG LOGS ===');
  },

  /**
   * Clear all debug logs
   */
  clear() {
    localStorage.removeItem(DEBUG_LOG_KEY);
    console.log('Debug logs cleared');
  },

  /**
   * Export logs as text
   */
  export(): string {
    const logs = this.getAll();
    return logs.map(entry => {
      let text = `[${entry.timestamp}] ${entry.message}`;
      if (entry.data) {
        text += `\n${entry.data}`;
      }
      return text;
    }).join('\n\n');
  }
};

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).debugLog = debugLog;
}
