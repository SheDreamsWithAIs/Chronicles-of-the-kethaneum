# Multi-Character Dialogue Panel System - Development Plan

**Created:** 2025-11-19
**Status:** Planning Phase
**Estimated Effort:** 16-22 hours

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Architecture Overview](#architecture-overview)
4. [Implementation Phases](#implementation-phases)
5. [Technical Specifications](#technical-specifications)
6. [Edge Cases & Considerations](#edge-cases--considerations)
7. [Testing Strategy](#testing-strategy)
8. [File Structure](#file-structure)

---

## Overview

### Goal

Upgrade the dialogue panel system to support **multi-character conversations** with a **sliding window display** of the 2 most recent dialogue entries.

### User Experience Flow

1. Player clicks "Start a Conversation" button
2. First character's panel appears (slides in from bottom)
3. Second character responds - their panel slides in from bottom, pushing first panel up
4. First character responds again - removes their original panel (slides out top), shifts second character's panel up, new panel slides in at bottom
5. Optional: Third character joins - their panel slides in at bottom, pushing up and removing the oldest panel

**Key Behavior:** Only the 2 most recent dialogue entries are visible at any time.

### Important Design Notes

- **Continue Button Behavior:** Should only advance the most recent character's dialogue (bottom panel). If that character has more text chunks to display, show the next chunk. If complete, advance to the next dialogue entry in the sequence.
- **Text Chunking:** Must preserve the existing text chunking system for long dialogue. Each panel displays text in chunks with the Continue button revealing more of the same character's dialogue before moving to the next character.

---

## Current State Analysis

### What Exists

**Dialogue Infrastructure:**
- `lib/dialogue/DialogueManager.ts` - Singleton manager for character dialogue and story events
- `lib/dialogue/types.ts` - Type definitions for characters, dialogue, story beats, emotions
- `hooks/dialogue/useDialogue.ts` - React hook for DialogueManager integration
- `public/data/characters/` - Character JSON files with dialogue data
- `public/data/story-events/` - Multi-character story event sequences
- `public/data/dialogue-config.json` - System configuration

**UI Components:**
- `app/library/page.tsx` - Library page with "Start a Conversation" button (line 143)
- Hardcoded single dialogue panel display (lines 108-126)
- `app/library/library.module.css` - Dialogue panel styling

**Key Files:**
- `/home/user/Chronicles-of-the-kethaneum/lib/dialogue/DialogueManager.ts`
- `/home/user/Chronicles-of-the-kethaneum/app/library/page.tsx`
- `/home/user/Chronicles-of-the-kethaneum/app/library/library.module.css`

### What's Missing

1. **Integration:** Library page doesn't use DialogueManager - shows static hardcoded text
2. **Multi-Panel System:** No support for displaying multiple dialogue panels simultaneously
3. **Sliding Window Logic:** No animation/transition system for panel queue management
4. **Story Event Player:** No component to play multi-character story event sequences
5. **Portrait Rendering:** Only placeholder text shown, actual portraits not rendered
6. **State Persistence:** Dialogue state not tracked in game state

---

## Architecture Overview

### Component Hierarchy

```
DialogueContainer (new)
├── DialogueQueue (new)
│   ├── DialoguePanel (new) - Position: Top (older message)
│   └── DialoguePanel (new) - Position: Bottom (newest message)
└── DialogueControls (new)
    └── Continue Button
```

### Data Flow

```
User Clicks "Start Conversation"
    ↓
DialogueManager.getRandomBanter() OR StoryEventPlayer.start()
    ↓
DialogueQueue receives new DialogueEntry
    ↓
Queue Management:
  - If queue.length === 2:
    • Remove top panel (exit animation)
    • Shift bottom panel to top (shift animation)
    • Add new panel at bottom (enter animation)
  - If queue.length < 2:
    • Shift existing panel(s) up
    • Add new panel at bottom
    ↓
Render 2 DialoguePanel components with animation states
    ↓
User clicks Continue:
  - If bottom panel has more text chunks → show next chunk
  - If bottom panel complete → trigger next dialogue entry
```

### Animation States

Each panel can be in one of these states:
- `entering` - Sliding in from bottom
- `active` - Visible and stationary
- `shifting` - Moving from bottom to top position
- `exiting` - Sliding out and fading away

---

## Implementation Phases

### Phase 1: Create Reusable Dialogue Panel Component

**File:** `components/dialogue/DialoguePanel.tsx` (new)

**Purpose:** Render a single character's dialogue panel with animations.

**Component Interface:**

```typescript
interface DialoguePanelProps {
  character: {
    id: string;
    name: string;
    title?: string;
    portraitFile?: string;
  };
  dialogueText: string;
  emotion?: string;
  animationState: 'entering' | 'active' | 'shifting' | 'exiting';
  position: 'top' | 'bottom';
  onAnimationComplete?: () => void;
  currentChunk?: number;
  totalChunks?: number;
}
```

**Key Features:**
- Display character portrait (load from public/data/portraits/)
- Show character name and title
- Render dialogue text (current chunk)
- Apply CSS class based on animationState
- Trigger callback when animation completes
- Show chunk indicator if multiple chunks (e.g., "1/3")
- Emotion-based styling (border color, background tint)

**Styling Classes:**
```css
.dialoguePanel - Base panel styles
.dialoguePanel--entering - Slide in from bottom
.dialoguePanel--active - Stationary
.dialoguePanel--shifting - Move to top position
.dialoguePanel--exiting - Slide out top
.dialoguePanel--top - Positioned at top
.dialoguePanel--bottom - Positioned at bottom
```

**Example JSX Structure:**
```tsx
<div className={`${styles.dialoguePanel} ${styles[`dialoguePanel--${animationState}`]} ${styles[`dialoguePanel--${position}`]}`}>
  <div className={styles.characterPortrait}>
    {portraitFile ? <img src={portraitFile} alt={name} /> : <div className={styles.portraitPlaceholder} />}
  </div>
  <div className={styles.dialogueContent}>
    <div className={styles.characterName}>{name}</div>
    {title && <div className={styles.characterTitle}>{title}</div>}
    <div className={styles.dialogueText}>{dialogueText}</div>
    {totalChunks && totalChunks > 1 && (
      <div className={styles.chunkIndicator}>{currentChunk}/{totalChunks}</div>
    )}
  </div>
</div>
```

---

### Phase 2: Build Dialogue Queue Manager

**File:** `components/dialogue/DialogueQueue.tsx` (new)

**Purpose:** Manage the sliding window of 2 dialogue panels with coordinated animations.

**Component Interface:**

```typescript
interface DialogueQueueProps {
  isActive: boolean;
  onQueueEmpty?: () => void;
}

interface DialogueQueueState {
  queue: DialogueEntry[];
  animationStates: Map<string, AnimationState>;
  isTransitioning: boolean;
}

interface DialogueEntry {
  id: string;
  character: CharacterData;
  text: string;
  emotion?: string;
  chunks?: string[];
  currentChunk?: number;
}
```

**Key Methods:**

```typescript
// Add new dialogue to queue
const addDialogue = (entry: DialogueEntry) => {
  if (queue.length >= 2) {
    // Remove oldest (top) panel
    setAnimationState(queue[0].id, 'exiting');
    // Shift middle panel up
    setAnimationState(queue[1].id, 'shifting');
  } else if (queue.length === 1) {
    // Shift existing panel up
    setAnimationState(queue[0].id, 'shifting');
  }

  // Add new panel at bottom
  const newQueue = [...queue.slice(-1), entry]; // Keep max 2
  setQueue(newQueue);
  setAnimationState(entry.id, 'entering');
};

// Handle continue button click
const handleContinue = () => {
  const bottomPanel = queue[queue.length - 1];

  if (bottomPanel.chunks && bottomPanel.currentChunk < bottomPanel.chunks.length - 1) {
    // Show next chunk of current character's dialogue
    updatePanelChunk(bottomPanel.id, bottomPanel.currentChunk + 1);
  } else {
    // Move to next dialogue entry (trigger from parent)
    onAdvanceDialogue();
  }
};

// Clean up after animation completes
const handleAnimationComplete = (entryId: string, state: AnimationState) => {
  if (state === 'exiting') {
    removeFromQueue(entryId);
  } else if (state === 'entering' || state === 'shifting') {
    setAnimationState(entryId, 'active');
  }
};
```

**State Management:**
- Maintain queue of max 2 DialogueEntry objects
- Track animation state for each entry
- Coordinate timing between multiple simultaneous animations
- Handle chunk advancement for text splitting

**Rendering Logic:**
```tsx
<div className={styles.dialogueQueueContainer}>
  {queue.map((entry, index) => (
    <DialoguePanel
      key={entry.id}
      character={entry.character}
      dialogueText={getCurrentChunkText(entry)}
      emotion={entry.emotion}
      animationState={animationStates.get(entry.id)}
      position={index === 0 ? 'top' : 'bottom'}
      currentChunk={entry.currentChunk}
      totalChunks={entry.chunks?.length}
      onAnimationComplete={() => handleAnimationComplete(entry.id, animationStates.get(entry.id))}
    />
  ))}
</div>
```

---

### Phase 3: Story Event Sequence Player

**File:** `lib/dialogue/StoryEventPlayer.ts` (new)

**Purpose:** Orchestrate multi-character story event sequences, handling timing and progression.

**Class Interface:**

```typescript
class StoryEventPlayer {
  private storyEvent: StoryEvent | null = null;
  private currentSequence: number = 0;
  private dialogueManager: DialogueManager;
  private playbackMode: 'auto' | 'manual' | 'hybrid' = 'manual';
  private isPaused: boolean = false;
  private onDialogueEmit?: (entry: DialogueEntry) => void;
  private onComplete?: () => void;

  constructor(dialogueManager: DialogueManager) {
    this.dialogueManager = dialogueManager;
  }

  // Load story event from DialogueManager
  async loadStoryEvent(eventId: string): Promise<void> {
    this.storyEvent = this.dialogueManager.getStoryEvent(eventId);
    this.currentSequence = 0;
    this.isPaused = false;
  }

  // Start playing the story event
  start(): void {
    if (!this.storyEvent) {
      throw new Error('No story event loaded');
    }
    this.emitNextDialogue();
  }

  // Get next dialogue in sequence
  next(): DialogueEntry | null {
    if (!this.storyEvent || this.currentSequence >= this.storyEvent.dialogue.length) {
      return null;
    }

    const dialogueData = this.storyEvent.dialogue[this.currentSequence];
    const character = this.storyEvent.characters.find(c => c.id === dialogueData.speaker);

    if (!character) {
      console.error(`Character ${dialogueData.speaker} not found in story event`);
      this.currentSequence++;
      return this.next(); // Skip to next
    }

    const entry: DialogueEntry = {
      id: `${this.storyEvent.id}-${this.currentSequence}`,
      character,
      text: dialogueData.text,
      emotion: dialogueData.emotion,
      chunks: this.chunkText(dialogueData.text), // Apply text chunking
      currentChunk: 0,
      pauseAfter: dialogueData.pauseAfter
    };

    this.currentSequence++;
    return entry;
  }

  // Emit next dialogue to queue
  private emitNextDialogue(): void {
    const entry = this.next();
    if (entry) {
      this.onDialogueEmit?.(entry);

      // Handle auto-advancement
      if (this.playbackMode === 'auto' && entry.pauseAfter) {
        setTimeout(() => this.emitNextDialogue(), entry.pauseAfter);
      }
    } else {
      // Story event complete
      this.onComplete?.();
    }
  }

  // Manual advancement (called by Continue button)
  advance(): void {
    if (this.playbackMode === 'manual') {
      this.emitNextDialogue();
    }
  }

  // Pause/resume playback
  pause(): void { this.isPaused = true; }
  resume(): void { this.isPaused = false; this.emitNextDialogue(); }

  // Reset to beginning
  reset(): void {
    this.currentSequence = 0;
    this.isPaused = false;
  }

  // Status checks
  getCurrentSequence(): number { return this.currentSequence; }
  isComplete(): boolean {
    return this.storyEvent
      ? this.currentSequence >= this.storyEvent.dialogue.length
      : true;
  }

  // Set callbacks
  onDialogue(callback: (entry: DialogueEntry) => void): void {
    this.onDialogueEmit = callback;
  }

  onCompleted(callback: () => void): void {
    this.onComplete = callback;
  }

  // Apply text chunking based on dialogue config
  private chunkText(text: string): string[] {
    const config = this.dialogueManager.getConfig();
    const maxLength = config?.textLimits?.desktop || 300;

    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks.length > 0 ? chunks : [text];
  }
}

export default StoryEventPlayer;
```

**Integration with DialogueQueue:**
```typescript
// In parent component
const eventPlayer = new StoryEventPlayer(dialogueManager);
eventPlayer.onDialogue((entry) => {
  dialogueQueue.addDialogue(entry);
});
eventPlayer.onCompleted(() => {
  console.log('Story event finished');
  setConversationActive(false);
});

// Load and start
await eventPlayer.loadStoryEvent('first-visit');
eventPlayer.start();
```

---

### Phase 4: Update Library Page Integration

**File:** `app/library/page.tsx` (modify)

**Changes Required:**

1. **Import new components:**
```typescript
import DialogueQueue from '@/components/dialogue/DialogueQueue';
import { useDialogue } from '@/hooks/dialogue/useDialogue';
import StoryEventPlayer from '@/lib/dialogue/StoryEventPlayer';
```

2. **Update state management:**
```typescript
const [conversationActive, setConversationActive] = useState(false);
const [eventPlayer, setEventPlayer] = useState<StoryEventPlayer | null>(null);
const dialogueQueueRef = useRef<DialogueQueueRef | null>(null);

const { dialogueManager, isInitialized, initialize } = useDialogue();

useEffect(() => {
  if (!isInitialized) {
    initialize();
  }
}, [isInitialized, initialize]);
```

3. **Update button handler:**
```typescript
const handleStartConversation = async () => {
  if (!dialogueManager || !dialogueQueueRef.current) return;

  setConversationActive(true);

  // Check for available story events first
  const availableEvent = await dialogueManager.getAvailableStoryEvent();

  if (availableEvent) {
    // Play story event sequence
    const player = new StoryEventPlayer(dialogueManager);
    player.onDialogue((entry) => {
      dialogueQueueRef.current?.addDialogue(entry);
    });
    player.onCompleted(() => {
      setConversationActive(false);
      setEventPlayer(null);
    });

    await player.loadStoryEvent(availableEvent.id);
    player.start();
    setEventPlayer(player);
  } else {
    // Show random character banter
    const banter = await dialogueManager.getRandomBanter();
    if (banter) {
      dialogueQueueRef.current?.addDialogue({
        id: `banter-${Date.now()}`,
        character: banter.character,
        text: banter.dialogue.text,
        emotion: banter.dialogue.emotion[0],
        chunks: chunkText(banter.dialogue.text),
        currentChunk: 0
      });
    }
  }
};
```

4. **Replace dialogue UI:**
```tsx
{conversationActive && (
  <DialogueQueue
    ref={dialogueQueueRef}
    isActive={conversationActive}
    onQueueEmpty={() => setConversationActive(false)}
    onContinue={() => {
      if (eventPlayer && !eventPlayer.isComplete()) {
        eventPlayer.advance();
      }
    }}
  />
)}
```

5. **Remove old hardcoded dialogue display** (lines 108-126)

---

### Phase 5: CSS Animations & Styling

**File:** `components/dialogue/dialogue.module.css` (new)

**Container Styles:**
```css
.dialogueQueueContainer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  pointer-events: none; /* Allow clicks to pass through empty space */
}

.dialogueOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 999;
  backdrop-filter: blur(4px);
}
```

**Panel Base Styles:**
```css
.dialoguePanel {
  position: relative;
  width: 100%;
  max-width: 900px;
  min-height: 250px;
  background: linear-gradient(135deg, #2a1810 0%, #1a0f08 100%);
  border: 2px solid #8b6f47;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
  display: flex;
  gap: 20px;
  pointer-events: auto;
  transform-origin: bottom center;
}

.dialoguePanel--top {
  opacity: 0.85; /* Slightly dimmed to emphasize bottom panel */
}

.dialoguePanel--bottom {
  opacity: 1;
  border-color: #d4af37; /* Brighter border for active panel */
}
```

**Animation States:**
```css
/* Entering from bottom */
.dialoguePanel--entering {
  animation: slideInFromBottom 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes slideInFromBottom {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Shifting from bottom to top position */
.dialoguePanel--shifting {
  animation: shiftToTop 500ms cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
}

@keyframes shiftToTop {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(calc(-100% - 20px)); /* Move up by own height + gap */
    opacity: 0.85;
  }
}

/* Exiting from top */
.dialoguePanel--exiting {
  animation: slideOutTop 500ms cubic-bezier(0.4, 0.0, 1, 1) forwards;
}

@keyframes slideOutTop {
  from {
    transform: translateY(0);
    opacity: 0.85;
  }
  to {
    transform: translateY(-150%);
    opacity: 0;
  }
}

/* Active state (no animation) */
.dialoguePanel--active {
  /* No animation, just static position */
}
```

**Character Portrait:**
```css
.characterPortrait {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #d4af37;
  background: linear-gradient(135deg, #4a3a2a 0%, #2a1a0a 100%);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.characterPortrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portraitPlaceholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  color: #8b6f47;
}
```

**Dialogue Content:**
```css
.dialogueContent {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.characterName {
  font-family: 'Dancing Script', cursive;
  font-size: 28px;
  color: #d4af37;
  margin: 0;
}

.characterTitle {
  font-family: 'Crimson Text', serif;
  font-size: 16px;
  color: #b8956f;
  font-style: italic;
  margin: 0;
}

.dialogueText {
  font-family: 'Crimson Text', serif;
  font-size: 18px;
  line-height: 1.6;
  color: #e8dcc4;
  margin: 10px 0;
  max-height: 150px;
  overflow-y: auto;
}

.chunkIndicator {
  font-family: 'Crimson Text', serif;
  font-size: 14px;
  color: #8b6f47;
  text-align: right;
  margin-top: auto;
}
```

**Emotion-Based Styling:**
```css
.dialoguePanel[data-emotion="warm"] {
  border-color: #ff8c42;
}

.dialoguePanel[data-emotion="professional"] {
  border-color: #4a90e2;
}

.dialoguePanel[data-emotion="mystical"] {
  border-color: #9b59b6;
}

.dialoguePanel[data-emotion="curious"] {
  border-color: #f39c12;
}

.dialoguePanel[data-emotion="serious"] {
  border-color: #e74c3c;
}
```

**Continue Button:**
```css
.continueButton {
  position: fixed;
  bottom: 40px;
  right: 40px;
  padding: 15px 30px;
  background: linear-gradient(135deg, #d4af37 0%, #8b6f47 100%);
  border: 2px solid #d4af37;
  border-radius: 8px;
  color: #1a0f08;
  font-family: 'Crimson Text', serif;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
  z-index: 1001;
}

.continueButton:hover {
  background: linear-gradient(135deg, #f4cf57 0%, #ab8f67 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.6);
}

.continueButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

**Responsive Design:**
```css
@media (max-width: 768px) {
  .dialoguePanel {
    max-width: 100%;
    min-height: 200px;
    padding: 20px;
    gap: 15px;
  }

  .characterPortrait {
    width: 100px;
    height: 100px;
  }

  .characterName {
    font-size: 22px;
  }

  .dialogueText {
    font-size: 16px;
    max-height: 120px;
  }

  .continueButton {
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    font-size: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dialoguePanel--entering,
  .dialoguePanel--shifting,
  .dialoguePanel--exiting {
    animation-duration: 0.01ms !important;
  }
}
```

---

### Phase 6: Enhanced State Management

**File:** `lib/game/state.ts` (modify)

**Add Dialogue State Interface:**
```typescript
interface DialogueState {
  currentConversationId?: string;
  activeStoryEventId?: string;
  completedStoryEvents: string[];
  conversationHistory: DialogueHistoryEntry[];
  lastCharacters: string[]; // Track recently used characters
  currentStoryBeat: StoryBeat;
}

interface DialogueHistoryEntry {
  timestamp: number;
  characterId: string;
  dialogueId: string;
  wasStoryEvent: boolean;
}

interface GameState {
  // ... existing fields
  dialogue: DialogueState;
}
```

**Update Initial State:**
```typescript
const initialState: GameState = {
  // ... existing fields
  dialogue: {
    completedStoryEvents: [],
    conversationHistory: [],
    lastCharacters: [],
    currentStoryBeat: 'hook'
  }
};
```

**Add Dialogue Actions:**
```typescript
// actions.ts
export const dialogueActions = {
  startConversation: (conversationId: string) => ({
    type: 'dialogue/start',
    payload: conversationId
  }),

  recordDialogue: (entry: DialogueHistoryEntry) => ({
    type: 'dialogue/record',
    payload: entry
  }),

  completeStoryEvent: (eventId: string) => ({
    type: 'dialogue/complete_story_event',
    payload: eventId
  }),

  updateStoryBeat: (beat: StoryBeat) => ({
    type: 'dialogue/update_story_beat',
    payload: beat
  }),

  endConversation: () => ({
    type: 'dialogue/end'
  })
};
```

**Add Reducer Cases:**
```typescript
// In your reducer
case 'dialogue/start':
  return {
    ...state,
    dialogue: {
      ...state.dialogue,
      currentConversationId: action.payload
    }
  };

case 'dialogue/record':
  return {
    ...state,
    dialogue: {
      ...state.dialogue,
      conversationHistory: [
        ...state.dialogue.conversationHistory,
        action.payload
      ],
      lastCharacters: [
        action.payload.characterId,
        ...state.dialogue.lastCharacters.slice(0, 2)
      ]
    }
  };

case 'dialogue/complete_story_event':
  return {
    ...state,
    dialogue: {
      ...state.dialogue,
      completedStoryEvents: [
        ...state.dialogue.completedStoryEvents,
        action.payload
      ]
    }
  };

case 'dialogue/update_story_beat':
  return {
    ...state,
    dialogue: {
      ...state.dialogue,
      currentStoryBeat: action.payload
    }
  };

case 'dialogue/end':
  return {
    ...state,
    dialogue: {
      ...state.dialogue,
      currentConversationId: undefined,
      activeStoryEventId: undefined
    }
  };
```

**Integration with DialogueManager:**

Modify `lib/dialogue/DialogueManager.ts` to sync with game state:

```typescript
// In DialogueManager
private gameState?: GameState;

setGameState(state: GameState): void {
  this.gameState = state;
  this.currentStoryBeat = state.dialogue.currentStoryBeat;
}

getAvailableStoryEvent(): StoryEvent | null {
  if (!this.gameState) return null;

  const completed = this.gameState.dialogue.completedStoryEvents;
  const available = Array.from(this.storyEvents.values())
    .filter(event => !completed.includes(event.id))
    .filter(event => this.isStoryBeatInRange(
      event.availableFrom,
      event.availableUntil,
      this.currentStoryBeat
    ));

  return available[0] || null;
}
```

---

### Phase 7: Testing & Polish

**File:** `cypress/e2e/multi-character-dialogue.cy.ts` (new)

**Test Suite:**

```typescript
describe('Multi-Character Dialogue System', () => {
  beforeEach(() => {
    cy.visit('/library');
    // Initialize dialogue system
    cy.window().then((win) => {
      // Mock or initialize DialogueManager
    });
  });

  describe('Dialogue Panel Display', () => {
    it('should display single panel for first dialogue', () => {
      cy.get('[data-testid="start-conversation-btn"]').click();
      cy.get('[data-testid="dialogue-panel"]').should('have.length', 1);
      cy.get('[data-testid="dialogue-panel"]').should('have.class', 'dialoguePanel--bottom');
    });

    it('should display two panels when second character speaks', () => {
      cy.get('[data-testid="start-conversation-btn"]').click();
      cy.get('[data-testid="continue-btn"]').click();

      cy.get('[data-testid="dialogue-panel"]').should('have.length', 2);
      cy.get('[data-testid="dialogue-panel"]').eq(0).should('have.class', 'dialoguePanel--top');
      cy.get('[data-testid="dialogue-panel"]').eq(1).should('have.class', 'dialoguePanel--bottom');
    });

    it('should maintain max 2 panels when third character speaks', () => {
      cy.get('[data-testid="start-conversation-btn"]').click();
      cy.get('[data-testid="continue-btn"]').click();
      cy.get('[data-testid="continue-btn"]').click();

      cy.get('[data-testid="dialogue-panel"]').should('have.length', 2);
    });
  });

  describe('Panel Animations', () => {
    it('should animate panel entering from bottom', () => {
      cy.get('[data-testid="start-conversation-btn"]').click();

      cy.get('[data-testid="dialogue-panel"]')
        .should('have.class', 'dialoguePanel--entering');

      cy.wait(500); // Animation duration

      cy.get('[data-testid="dialogue-panel"]')
        .should('have.class', 'dialoguePanel--active');
    });

    it('should animate panel shifting to top position', () => {
      cy.get('[data-testid="start-conversation-btn"]').click();

      cy.get('[data-testid="dialogue-panel"]')
        .as('firstPanel')
        .invoke('offset')
        .then((firstPos) => {
          cy.get('[data-testid="continue-btn"]').click();

          cy.get('@firstPanel')
            .should('have.class', 'dialoguePanel--shifting');

          cy.wait(500);

          cy.get('@firstPanel')
            .invoke('offset')
            .should((newPos) => {
              expect(newPos.top).to.be.lessThan(firstPos.top);
            });
        });
    });

    it('should remove oldest panel when third dialogue appears', () => {
      cy.get('[data-testid="start-conversation-btn"]').click();

      cy.get('[data-testid="dialogue-panel"]')
        .first()
        .invoke('attr', 'data-dialogue-id')
        .as('firstPanelId');

      cy.get('[data-testid="continue-btn"]').click();
      cy.get('[data-testid="continue-btn"]').click();

      cy.get('@firstPanelId').then((id) => {
        cy.get(`[data-dialogue-id="${id}"]`).should('not.exist');
      });
    });
  });

  describe('Text Chunking', () => {
    it('should display chunk indicator for multi-chunk dialogue', () => {
      // Mock long dialogue text
      cy.window().then((win) => {
        // Setup dialogue with multiple chunks
      });

      cy.get('[data-testid="start-conversation-btn"]').click();
      cy.get('[data-testid="chunk-indicator"]').should('contain', '1/3');
    });

    it('should advance chunks before advancing dialogue', () => {
      cy.get('[data-testid="start-conversation-btn"]').click();
      cy.get('[data-testid="chunk-indicator"]').should('contain', '1/3');

      cy.get('[data-testid="continue-btn"]').click();
      cy.get('[data-testid="chunk-indicator"]').should('contain', '2/3');

      cy.get('[data-testid="continue-btn"]').click();
      cy.get('[data-testid="chunk-indicator"]').should('contain', '3/3');

      // Next click should advance to next character
      cy.get('[data-testid="continue-btn"]').click();
      cy.get('[data-testid="dialogue-panel"]').should('have.length', 2);
    });
  });

  describe('Story Event Playback', () => {
    it('should play multi-character story event in sequence', () => {
      // Mock story event
      cy.window().then((win) => {
        // Setup story event with 3 characters
      });

      cy.get('[data-testid="start-conversation-btn"]').click();

      // First character
      cy.get('[data-testid="character-name"]').should('contain', 'Archivist Lumina');

      // Second character
      cy.get('[data-testid="continue-btn"]').click();
      cy.get('[data-testid="character-name"]').last().should('contain', 'Tester Testerson');

      // Third character
      cy.get('[data-testid="continue-btn"]').click();
      cy.get('[data-testid="character-name"]').last().should('contain', 'Professor Lengthy');
    });

    it('should complete story event and update game state', () => {
      cy.window().then((win) => {
        // Setup story event
      });

      cy.get('[data-testid="start-conversation-btn"]').click();

      // Click through all dialogue
      cy.get('[data-testid="continue-btn"]').click();
      cy.get('[data-testid="continue-btn"]').click();
      cy.get('[data-testid="continue-btn"]').click();

      // Verify story event marked complete
      cy.window().its('gameState.dialogue.completedStoryEvents')
        .should('include', 'first-visit');
    });
  });

  describe('Character Portraits', () => {
    it('should load and display character portrait', () => {
      cy.get('[data-testid="start-conversation-btn"]').click();

      cy.get('[data-testid="character-portrait"]')
        .find('img')
        .should('have.attr', 'src')
        .and('include', '/data/portraits/');
    });

    it('should show placeholder when portrait missing', () => {
      // Mock character without portrait
      cy.window().then((win) => {
        // Setup character with no portraitFile
      });

      cy.get('[data-testid="start-conversation-btn"]').click();
      cy.get('[data-testid="portrait-placeholder"]').should('exist');
    });
  });

  describe('Emotion Styling', () => {
    it('should apply emotion-based border color', () => {
      cy.get('[data-testid="start-conversation-btn"]').click();

      cy.get('[data-testid="dialogue-panel"]')
        .should('have.attr', 'data-emotion', 'warm')
        .and('have.css', 'border-color', 'rgb(255, 140, 66)'); // #ff8c42
    });
  });

  describe('Accessibility', () => {
    it('should announce new dialogue to screen readers', () => {
      cy.get('[data-testid="start-conversation-btn"]').click();

      cy.get('[data-testid="dialogue-panel"]')
        .should('have.attr', 'role', 'article')
        .and('have.attr', 'aria-live', 'polite');
    });

    it('should support keyboard navigation', () => {
      cy.get('[data-testid="start-conversation-btn"]').click();

      cy.get('body').type('{enter}'); // Should trigger continue
      cy.get('[data-testid="dialogue-panel"]').should('have.length', 2);
    });

    it('should respect prefers-reduced-motion', () => {
      cy.wrap(
        Cypress.automation('remote:debugger:protocol', {
          command: 'Emulation.setEmulatedMedia',
          params: {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
          }
        })
      );

      cy.get('[data-testid="start-conversation-btn"]').click();

      // Animations should be near-instant
      cy.get('[data-testid="dialogue-panel"]')
        .should('have.css', 'animation-duration', '0.01ms');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should adjust layout for mobile screens', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="start-conversation-btn"]').click();

      cy.get('[data-testid="dialogue-panel"]')
        .should('have.css', 'padding', '20px');

      cy.get('[data-testid="character-portrait"]')
        .should('have.css', 'width', '100px');
    });
  });
});
```

**Manual Testing Checklist:**

- [ ] Single dialogue panel appears correctly
- [ ] Second panel appears and first shifts up
- [ ] Third dialogue removes first panel correctly
- [ ] Animations are smooth without jank
- [ ] Character portraits load and display
- [ ] Portrait placeholders work when image missing
- [ ] Text chunks advance correctly
- [ ] Continue button only advances bottom panel
- [ ] Story events play in correct sequence
- [ ] Emotion-based styling applies
- [ ] Mobile layout works (portrait and landscape)
- [ ] Tablet layout works
- [ ] Desktop layout works
- [ ] Overlay background appears
- [ ] Close functionality works
- [ ] Keyboard navigation works
- [ ] Screen reader announcements work
- [ ] Reduced motion preference respected
- [ ] Very long dialogue text scrolls correctly
- [ ] Multiple rapid clicks don't break state
- [ ] State persists across page navigation
- [ ] Story event completion saves to game state

---

## Technical Specifications

### Continue Button Behavior (Important!)

**Priority:** The Continue button should ONLY advance the **bottom panel** (most recent dialogue).

**Logic Flow:**

1. **Check if bottom panel has more text chunks:**
   - YES → Display next chunk in bottom panel
   - NO → Proceed to step 2

2. **Check if more dialogue entries in sequence:**
   - YES → Add next dialogue entry to queue (triggers sliding animation)
   - NO → End conversation

**Implementation:**
```typescript
const handleContinue = () => {
  const bottomPanel = dialogueQueue[dialogueQueue.length - 1];

  // Step 1: Check for more chunks in current panel
  if (bottomPanel.chunks && bottomPanel.currentChunk < bottomPanel.chunks.length - 1) {
    // Update bottom panel with next chunk
    updateBottomPanelChunk(bottomPanel.id, bottomPanel.currentChunk + 1);
    return; // Don't advance to next dialogue yet
  }

  // Step 2: Advance to next dialogue entry
  if (storyEventPlayer && !storyEventPlayer.isComplete()) {
    storyEventPlayer.advance(); // This will add new entry to queue
  } else {
    // No more dialogue - end conversation
    endConversation();
  }
};
```

**Visual Feedback:**
- If more chunks: Button text shows "Continue" or "..."
- If last chunk but more dialogue: Button text shows "Continue" with character hint
- If last dialogue: Button text shows "Close" or "Finish"

---

### Text Chunking System Preservation

**Current System:** The existing dialogue config defines text limits for different devices:
```json
{
  "textLimits": {
    "mobile": 150,
    "tablet": 250,
    "desktop": 300
  }
}
```

**Must Preserve:**
1. Chunking happens based on sentence boundaries
2. Each chunk respects device-specific character limits
3. Chunks are pre-calculated when dialogue entry is created
4. Panel displays current chunk with indicator (e.g., "2/4")

**Implementation:**
```typescript
// In StoryEventPlayer or DialogueQueue
const chunkText = (text: string, deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'): string[] => {
  const config = dialogueManager.getConfig();
  const maxLength = config.textLimits[deviceType];

  // Split by sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        // Single sentence exceeds limit - break by words
        const words = sentence.split(' ');
        let wordChunk = '';
        for (const word of words) {
          if ((wordChunk + word).length > maxLength) {
            chunks.push(wordChunk.trim());
            wordChunk = word;
          } else {
            wordChunk += (wordChunk ? ' ' : '') + word;
          }
        }
        if (wordChunk) currentChunk = wordChunk;
      }
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
};

// When creating dialogue entry
const entry: DialogueEntry = {
  id: generateId(),
  character: character,
  text: dialogueData.text,
  emotion: dialogueData.emotion,
  chunks: chunkText(dialogueData.text, detectDeviceType()),
  currentChunk: 0
};
```

---

### Animation Timing & Coordination

**Timing Configuration:**
```typescript
const ANIMATION_DURATIONS = {
  panelEnter: 500,    // Slide in from bottom
  panelShift: 500,    // Move from bottom to top
  panelExit: 500,     // Slide out and fade
  stagger: 100        // Delay between simultaneous animations
};
```

**Coordination:**
When adding third dialogue entry (queue already has 2):

1. **Frame 0ms:**
   - Mark top panel as 'exiting'
   - Mark bottom panel as 'shifting'
   - Create new panel as 'entering'

2. **Frame 100ms (stagger):**
   - Start new panel animation

3. **Frame 500ms:**
   - Top panel exit complete → remove from DOM
   - Bottom panel shift complete → reclassify as 'top'
   - New panel enter complete → classify as 'bottom', 'active'

**Implementation:**
```typescript
const addDialogue = async (entry: DialogueEntry) => {
  if (queue.length >= 2) {
    // Set animation states
    setAnimationState(queue[0].id, 'exiting');
    setAnimationState(queue[1].id, 'shifting');

    // Wait for stagger delay
    await sleep(ANIMATION_DURATIONS.stagger);

    // Add new panel
    const newQueue = [queue[1], entry];
    setQueue(newQueue);
    setAnimationState(entry.id, 'entering');

    // Clean up after animations complete
    setTimeout(() => {
      setAnimationState(queue[1].id, 'active');
      setAnimationState(entry.id, 'active');
      removeAnimationState(queue[0].id);
    }, ANIMATION_DURATIONS.panelEnter);
  }
  // ... handle other cases
};
```

---

## Edge Cases & Considerations

### 1. Rapid Continue Clicks

**Problem:** User clicks Continue rapidly, causing animation conflicts.

**Solution:**
- Disable Continue button during transitions
- Queue button clicks and process after animation
- Add `isTransitioning` flag to prevent concurrent animations

```typescript
const [isTransitioning, setIsTransitioning] = useState(false);

const handleContinue = async () => {
  if (isTransitioning) return; // Ignore clicks during animation

  setIsTransitioning(true);

  // Process continue logic
  await addDialogue(nextEntry);

  // Wait for animations
  await sleep(ANIMATION_DURATIONS.panelEnter);

  setIsTransitioning(false);
};
```

---

### 2. Very Long Dialogue Text

**Problem:** Dialogue text exceeds panel height.

**Solution:**
- Make dialogue text area scrollable
- Apply `max-height` and `overflow-y: auto`
- Show scroll indicator if content overflows
- Consider auto-chunking very long text

```css
.dialogueText {
  max-height: 150px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #8b6f47 #2a1810;
}

.dialogueText::-webkit-scrollbar {
  width: 8px;
}

.dialogueText::-webkit-scrollbar-track {
  background: #2a1810;
}

.dialogueText::-webkit-scrollbar-thumb {
  background: #8b6f47;
  border-radius: 4px;
}
```

---

### 3. Missing Character Portraits

**Problem:** Character portrait file doesn't exist or fails to load.

**Solution:**
- Show placeholder with character initial
- Graceful fallback to default portrait
- Log warning but don't break UI

```typescript
const [portraitError, setPortraitError] = useState(false);

<div className={styles.characterPortrait}>
  {character.portraitFile && !portraitError ? (
    <img
      src={character.portraitFile}
      alt={character.name}
      onError={() => setPortraitError(true)}
    />
  ) : (
    <div className={styles.portraitPlaceholder}>
      {character.name.charAt(0)}
    </div>
  )}
</div>
```

---

### 4. Story Event Completion

**Problem:** What happens when story event ends?

**Solution:**
- Fade out overlay and panels
- Show completion message (optional)
- Save event as completed in game state
- Return to library/main view

```typescript
storyEventPlayer.onCompleted(() => {
  // Mark event complete
  dispatch(dialogueActions.completeStoryEvent(eventId));

  // Show completion (optional)
  showNotification('Story event completed!');

  // Clean up
  setTimeout(() => {
    setConversationActive(false);
    dialogueQueue.clear();
  }, 1000);
});
```

---

### 5. Portrait Loading Performance

**Problem:** Loading multiple portrait images can be slow.

**Solution:**
- Preload portraits for upcoming characters
- Use lazy loading for portraits
- Cache loaded portraits in memory
- Provide low-res placeholder while loading

```typescript
// In StoryEventPlayer
const preloadPortraits = async () => {
  if (!this.storyEvent) return;

  const portraitPromises = this.storyEvent.characters
    .filter(c => c.portraitFile)
    .map(c => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve; // Don't fail if image missing
        img.src = c.portraitFile;
      });
    });

  await Promise.all(portraitPromises);
};

// Call before starting
await storyEventPlayer.loadStoryEvent(eventId);
await storyEventPlayer.preloadPortraits();
storyEventPlayer.start();
```

---

### 6. Multiple Conversations Support

**Problem:** What if player starts new conversation while one is active?

**Solution:**
- Prevent starting new conversation if one is active
- OR: Provide "End Conversation" option
- Save conversation state for resumption (advanced)

```typescript
const handleStartConversation = () => {
  if (conversationActive) {
    // Show warning or auto-close existing conversation
    if (confirm('End current conversation?')) {
      endCurrentConversation();
    } else {
      return; // Don't start new conversation
    }
  }

  startNewConversation();
};
```

---

### 7. Mobile Touch Gestures

**Problem:** On mobile, users might expect swipe gestures.

**Solution (Future Enhancement):**
- Swipe up to advance dialogue
- Swipe down to close conversation
- Tap panel directly to focus/expand

---

### 8. Accessibility - Screen Readers

**Problem:** Screen readers need proper announcements.

**Solution:**
- Use `aria-live` regions for new dialogue
- Announce character name and text
- Provide skip/close options

```tsx
<div
  className={styles.dialoguePanel}
  role="article"
  aria-live="polite"
  aria-label={`${character.name}: ${dialogueText}`}
>
  {/* Panel content */}
</div>

<div aria-live="assertive" className="sr-only">
  {/* Announce important changes */}
  {newDialogueAnnouncement}
</div>
```

---

### 9. Performance with Long Conversations

**Problem:** Long conversations could accumulate memory/DOM overhead.

**Solution:**
- Only render 2 panels (already doing this)
- Clear conversation history after certain length
- Provide conversation log view separately if needed

---

### 10. Animation Jank/Stuttering

**Problem:** Animations might stutter on low-end devices.

**Solution:**
- Use `transform` and `opacity` (GPU-accelerated)
- Avoid animating `height`, `width`, `margin`
- Use `will-change` sparingly
- Test on low-end devices
- Respect `prefers-reduced-motion`

```css
.dialoguePanel {
  will-change: transform, opacity; /* Only during animation */
}

.dialoguePanel--active {
  will-change: auto; /* Remove when not animating */
}
```

---

## File Structure

### New Files to Create

```
components/
└── dialogue/
    ├── DialoguePanel.tsx          (Phase 1)
    ├── DialogueQueue.tsx          (Phase 2)
    ├── DialogueControls.tsx       (Phase 2)
    └── dialogue.module.css        (Phase 5)

lib/
└── dialogue/
    └── StoryEventPlayer.ts        (Phase 3)

cypress/
└── e2e/
    └── multi-character-dialogue.cy.ts  (Phase 7)
```

### Files to Modify

```
app/
└── library/
    ├── page.tsx                   (Phase 4)
    └── library.module.css         (Phase 5 - cleanup)

lib/
├── game/
│   └── state.ts                   (Phase 6)
└── dialogue/
    └── DialogueManager.ts         (Phase 6 - add getAvailableStoryEvent)

hooks/
└── dialogue/
    └── useDialogue.ts             (Phase 4 - if needed)
```

---

## Implementation Checklist

### Phase 1: Dialogue Panel Component
- [ ] Create `components/dialogue/DialoguePanel.tsx`
- [ ] Implement props interface
- [ ] Add portrait rendering logic
- [ ] Add portrait error handling
- [ ] Implement animation state classes
- [ ] Add chunk indicator display
- [ ] Add emotion data attribute
- [ ] Add accessibility attributes
- [ ] Test component in isolation

### Phase 2: Dialogue Queue
- [ ] Create `components/dialogue/DialogueQueue.tsx`
- [ ] Implement queue state management
- [ ] Add `addDialogue()` method with animation logic
- [ ] Add `handleContinue()` method with chunk advancement
- [ ] Add animation coordination logic
- [ ] Implement panel removal after exit animation
- [ ] Add transition lock mechanism
- [ ] Create DialogueControls component with Continue button
- [ ] Test queue with mock data

### Phase 3: Story Event Player
- [ ] Create `lib/dialogue/StoryEventPlayer.ts`
- [ ] Implement class structure and constructor
- [ ] Add `loadStoryEvent()` method
- [ ] Add `start()`, `next()`, `advance()` methods
- [ ] Implement text chunking logic
- [ ] Add portrait preloading
- [ ] Add event callbacks (onDialogue, onComplete)
- [ ] Add playback state management
- [ ] Test with sample story event

### Phase 4: Library Page Integration
- [ ] Import new components into `app/library/page.tsx`
- [ ] Add state management for conversation
- [ ] Update `handleStartConversation` logic
- [ ] Add DialogueManager initialization
- [ ] Integrate StoryEventPlayer
- [ ] Replace hardcoded dialogue UI with DialogueQueue
- [ ] Add cleanup on conversation end
- [ ] Test full integration

### Phase 5: CSS Styling
- [ ] Create `components/dialogue/dialogue.module.css`
- [ ] Add container and overlay styles
- [ ] Implement panel base styles
- [ ] Add all animation keyframes
- [ ] Add animation state classes
- [ ] Style character portrait and content
- [ ] Add emotion-based styling
- [ ] Style Continue button
- [ ] Add mobile responsive styles
- [ ] Add reduced motion support
- [ ] Clean up old styles in `library.module.css`

### Phase 6: State Management
- [ ] Add dialogue state interface to `lib/game/state.ts`
- [ ] Update initial state
- [ ] Create dialogue actions
- [ ] Add reducer cases
- [ ] Integrate with DialogueManager
- [ ] Add state persistence logic
- [ ] Test state updates

### Phase 7: Testing
- [ ] Create Cypress test file
- [ ] Write panel display tests
- [ ] Write animation tests
- [ ] Write text chunking tests
- [ ] Write story event playback tests
- [ ] Write portrait loading tests
- [ ] Write emotion styling tests
- [ ] Write accessibility tests
- [ ] Write mobile responsiveness tests
- [ ] Perform manual testing checklist
- [ ] Fix any bugs discovered
- [ ] Performance testing

### Final Polish
- [ ] Code review
- [ ] Refactor any duplicated logic
- [ ] Add code comments
- [ ] Update documentation
- [ ] Test on multiple browsers
- [ ] Test on multiple devices
- [ ] Verify all edge cases handled
- [ ] Final QA pass

---

## Notes for Future AI/Developer

### Context Preservation

**Key System:** The text chunking system is already implemented in the DialogueManager config (`/home/user/Chronicles-of-the-kethaneum/public/data/dialogue-config.json`). Make sure to use this configuration when implementing chunking logic in StoryEventPlayer.

**Continue Button Priority:** The most critical requirement is that the Continue button ONLY advances the bottom panel's text chunks first, before moving to the next dialogue entry. This maintains focus on the most recent speaker.

**Existing Code:** The library page currently has a hardcoded dialogue display. You'll need to completely replace this (lines 108-126 in `app/library/page.tsx`) with the new DialogueQueue component.

### Testing Strategy

Start with **Phase 1** (DialoguePanel component) in isolation. Create a simple test page that renders a DialoguePanel with different props to verify rendering, animations, and styling work correctly before moving to the queue system.

### Performance Considerations

The two-panel limit is intentional for performance. Don't be tempted to increase this without thorough testing on low-end devices. The sliding window provides good UX while maintaining performance.

### Accessibility

This is a visual-heavy feature, but accessibility must not be neglected. Screen readers should announce new dialogue, keyboard navigation should work, and reduced motion should be respected.

---

## Estimated Timeline

Assuming a single developer working ~4-6 hours per day:

- **Week 1:** Phases 1-3 (Components & Player)
- **Week 2:** Phases 4-5 (Integration & Styling)
- **Week 3:** Phases 6-7 (State & Testing)
- **Buffer:** 2-3 days for polish and bug fixes

**Total:** ~3 weeks

For a team or part-time work, adjust accordingly.

---

## Success Criteria

The implementation is complete when:

1. ✅ Two dialogue panels can display simultaneously
2. ✅ New panels slide in from bottom with smooth animation
3. ✅ Old panels slide out when third dialogue appears
4. ✅ Continue button advances chunks first, then dialogue
5. ✅ Text chunking system works correctly
6. ✅ Character portraits load and display
7. ✅ Story events play multi-character sequences
8. ✅ All animations are smooth (no jank)
9. ✅ Mobile, tablet, desktop layouts work
10. ✅ Accessibility requirements met
11. ✅ All Cypress tests pass
12. ✅ Manual testing checklist complete

---

## Questions & Clarifications

If you're picking up this work and have questions:

1. **What dialogue should appear first?** Check for available story events first (based on story beat and completion status). If none available, show random character banter.

2. **How do characters get selected for banter?** DialogueManager already has logic to avoid recently used characters (3-character window) and filters by story beat availability.

3. **What if a character has no portrait?** Show a placeholder with their first initial. See edge case #3.

4. **Can conversations be saved/resumed?** Not in the initial implementation, but the state management in Phase 6 sets up for this future feature.

5. **Should there be a close button?** Yes, include a close/exit button in the overlay to allow users to end conversation early.

---

**End of Development Plan**

*This document should provide sufficient detail for any AI or developer to pick up and implement the multi-character dialogue system. Good luck!*
