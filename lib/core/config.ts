/**
 * Configuration module for Chronicles of the Kethaneum
 * This module manages game configuration and settings
 */

export interface DifficultyLevel {
  gridSize: number;
  timeLimit: number;
  maxWords: number;
}

export interface TestingConfig {
  enabled: boolean;
  skipTimers: boolean;
  showAllWords: boolean;
  autoWin: boolean;
  loadAllPuzzles: boolean;
}

export interface FeatureFlags {
  hapticFeedback: boolean;
  animations: boolean;
  progressTracking: boolean;
  soundEffects: boolean;
}

export interface SystemSettings {
  debugMode: boolean;
  persistence: boolean;
  errorReporting: boolean;
}

export interface Config {
  gridSize: number;
  timeLimit: number;
  minWordLength: number;
  maxWordLength: number;
  maxWords: number;
  directions: number[][];
  difficultyLevels: {
    easy: DifficultyLevel;
    medium: DifficultyLevel;
    hard: DifficultyLevel;
  };
  testing: TestingConfig;
  features: FeatureFlags;
  system: SystemSettings;
}

// Default configuration values
const defaultConfig: Config = {
  // Game settings
  gridSize: 10,
  timeLimit: 180, // 3 minutes
  minWordLength: 3,
  maxWordLength: 10,
  maxWords: 10,
  
  // Word directions
  directions: [
    [0, 1],   // right
    [1, 0],   // down
    [1, 1],   // diagonal down-right
    [0, -1],  // left
    [-1, 0],  // up
    [-1, -1], // diagonal up-left
    [1, -1],  // diagonal down-left
    [-1, 1]   // diagonal up-right
  ],
  
  // Difficulty settings
  difficultyLevels: {
    easy: {
      gridSize: 8,
      timeLimit: 240, // 4 minutes
      maxWords: 6
    },
    medium: {
      gridSize: 10,
      timeLimit: 180, // 3 minutes
      maxWords: 8
    },
    hard: {
      gridSize: 12,
      timeLimit: 150, // 2.5 minutes
      maxWords: 10
    }
  },
  
  // Testing flags
  testing: {
    enabled: false,
    skipTimers: false,
    showAllWords: false,
    autoWin: false,
    loadAllPuzzles: true
  },
  
  // Feature flags
  features: {
    hapticFeedback: true,
    animations: true,
    progressTracking: true,
    soundEffects: false
  },
  
  // System settings
  system: {
    debugMode: false,
    persistence: true,
    errorReporting: false
  }
};

// Current active configuration
let activeConfig: Config = { ...defaultConfig };

/**
 * Get the full active configuration
 */
export function getConfig(): Config {
  return { ...activeConfig };
}

/**
 * Get a specific configuration value
 */
export function get(key: string, defaultValue: any = null): any {
  const path = key.split('.');
  let current: any = activeConfig;
  
  for (const part of path) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[part];
    if (current === undefined) {
      return defaultValue;
    }
  }
  
  return current !== undefined ? current : defaultValue;
}

/**
 * Set a specific configuration value
 */
export function set(key: string, value: any): boolean {
  const path = key.split('.');
  const lastKey = path.pop();
  if (!lastKey) return false;
  
  let current: any = activeConfig;
  
  // Traverse the path
  for (const part of path) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return false;
    }
    
    // Create the path if it doesn't exist
    if (current[part] === undefined) {
      current[part] = {};
    }
    
    current = current[part];
  }
  
  // Set the value
  current[lastKey] = value;
  return true;
}

/**
 * Apply a difficulty level
 */
export function setDifficultyLevel(level: 'easy' | 'medium' | 'hard'): boolean {
  if (!defaultConfig.difficultyLevels[level]) {
    console.warn(`Unknown difficulty level: ${level}`);
    return false;
  }
  
  // Apply difficulty settings
  const difficultySettings = defaultConfig.difficultyLevels[level];
  for (const [key, value] of Object.entries(difficultySettings)) {
    (activeConfig as any)[key] = value;
  }
  
  return true;
}

/**
 * Enable testing mode
 */
export function enableTestingMode(options: Partial<TestingConfig> = {}): void {
  // Enable main testing flag
  activeConfig.testing.enabled = true;
  
  // Apply specific testing options
  for (const [key, value] of Object.entries(options)) {
    if ((activeConfig.testing as any)[key] !== undefined) {
      (activeConfig.testing as any)[key] = value;
    }
  }
  
  console.log('Testing mode enabled with options:', activeConfig.testing);
}

/**
 * Disable testing mode
 */
export function disableTestingMode(): void {
  // Reset all testing flags to defaults
  activeConfig.testing = { ...defaultConfig.testing };
  activeConfig.testing.enabled = false;
  
  console.log('Testing mode disabled');
}

/**
 * Reset configuration to defaults
 */
export function resetToDefaults(): void {
  activeConfig = { ...defaultConfig };
  console.log('Configuration reset to defaults');
}

/**
 * Export configuration as JSON string
 */
export function exportConfig(): string {
  return JSON.stringify(activeConfig, null, 2);
}

/**
 * Import configuration from JSON string
 */
export function importConfig(json: string): boolean {
  try {
    const newConfig = JSON.parse(json);
    // Validate config structure
    if (typeof newConfig !== 'object' || newConfig === null) {
      throw new Error('Invalid configuration format');
    }
    
    // Apply new config
    activeConfig = newConfig;
    return true;
  } catch (error) {
    console.error('Error importing configuration:', error);
    return false;
  }
}

