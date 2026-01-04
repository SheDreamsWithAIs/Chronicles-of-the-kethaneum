'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useGameState as useGameStateHook } from '@/hooks/useGameState';
import type { GameState } from '@/lib/game/state';

interface GameStateContextValue {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  updateState: (updates: Partial<GameState>) => void;
  isReady: boolean;
  initialize: () => Promise<void>;
  resetProgress: () => Promise<void>;
}

const GameStateContext = createContext<GameStateContextValue | null>(null);

/**
 * Provider that creates a SINGLE instance of useGameState for the entire app
 * This prevents multiple instances from fighting over localStorage
 */
export function GameStateProvider({ children }: { children: ReactNode }) {
  // This is the ONLY place useGameState hook should be called
  const gameState = useGameStateHook();

  return (
    <GameStateContext.Provider value={gameState}>
      {children}
    </GameStateContext.Provider>
  );
}

/**
 * Hook to access the shared game state
 * Use this instead of calling useGameState() directly
 */
export function useGameState() {
  const context = useContext(GameStateContext);

  if (!context) {
    throw new Error('useGameState must be used within GameStateProvider');
  }

  return context;
}
