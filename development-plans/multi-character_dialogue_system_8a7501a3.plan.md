---
name: Multi-Character Dialogue System
overview: Implement a multi-character dialogue panel system with sliding window display (2 panels max), coordinated animations, text chunking, and story event playback integration.
todos:
  - id: phase1-panel-component
    content: "Phase 1: Create DialoguePanel component with portrait, text, chunk indicator, and base styles"
    status: pending
  - id: phase2-queue-manager
    content: "Phase 2: Build DialogueQueue with 2-panel sliding window, animation states, and Continue button logic"
    status: pending
  - id: phase3-animations-styling
    content: "Phase 3: Implement CSS animations (slideIn, shift, slideOut) and complete styling with responsive design"
    status: pending
  - id: phase4-story-player
    content: "Phase 4: Create StoryEventPlayer class for orchestrating multi-character story event sequences with text chunking"
    status: pending
  - id: phase5-library-integration
    content: "Phase 5: Integrate DialogueQueue into library page, replace hardcoded dialogue, connect StoryEventPlayer"
    status: pending
  - id: phase6-state-management
    content: "Phase 6: Add dialogue state to game state, track completed events, integrate with DialogueManager"
    status: pending
  - id: phase7-testing-polish
    content: "Phase 7: Create Cypress tests, manual testing, performance testing, and bug fixes"
    status: pending
---

# Multi-Character Dialogue System - Phase-Based Implementation Plan

## Overview

Upgrade the dialogue system to support multi-character conversations with a sliding window of 2 dialogue panels. The system will integrate with existing DialogueManager and StoryEventPlayer, replacing the hardcoded single-panel display in the library page.

## Current State

- **DialogueManager** exists and handles character banter and story events
- **Library page** (`app/library/page.tsx`) has hardcoded single dialogue panel (lines 210-228)
- **Story events** are structured with multi-character dialogue sequences
- **Text chunking** config exists in `dialogue-config.json`
- **useDialogue hook** provides DialogueManager integration

## Phase Breakdown

### Phase 1: Core Dialogue Panel Component

**Goal:** Create reusable DialoguePanel component with portrait, text, and animation states

**Files:**

- `components/dialogue/DialoguePanel.tsx` (new)
- `components/dialogue/dialogue.module.css` (new - partial)

**Tasks:**

1. Create DialoguePanel component with props interface
2. Implement portrait rendering with error handling
3. Add character name, title, and dialogue text display
4. Add chunk indicator (e.g., "1/3") for multi-chunk dialogue
5. Add emotion data attribute for styling
6. Add accessibility attributes (aria-live, role)
7. Create base CSS styles (no animations yet)

**Testing:** Render panel with mock data, verify portrait loading, test error states

**Dependencies:** None

---

### Phase 2: Dialogue Queue Manager

**Goal:** Build queue system that manages 2 panels with animation coordination

**Files:**

- `components/dialogue/DialogueQueue.tsx` (new)
- `components/dialogue/DialogueControls.tsx` (new)

**Tasks:**

1. Create DialogueQueue component with queue state (max 2 entries)
2. Implement `addDialogue()` method with queue management logic
3. Add animation state tracking (entering, active, shifting, exiting)
4. Implement transition lock to prevent rapid clicks
5. Create DialogueControls component with Continue button
6. Implement `handleContinue()` with chunk advancement logic:

   - Check if bottom panel has more chunks → advance chunk
   - Otherwise → trigger next dialogue entry

7. Add animation completion callbacks

**Testing:** Test queue with 1, 2, and 3+ dialogue entries, verify max 2 panels displayed

**Dependencies:** Phase 1 (DialoguePanel component)

---

### Phase 3: CSS Animations & Styling

**Goal:** Implement smooth panel animations and complete styling

**Files:**

- `components/dialogue/dialogue.module.css` (complete)

**Tasks:**

1. Add animation keyframes (slideInFromBottom, shiftToTop, slideOutTop)
2. Implement animation state classes (entering, shifting, exiting, active)
3. Add position classes (top, bottom) with opacity differences
4. Style character portrait with border and placeholder
5. Style dialogue content (name, title, text)
6. Add emotion-based border colors
7. Style Continue button with hover states
8. Add responsive styles (mobile, tablet, desktop)
9. Add reduced motion support
10. Add overlay background styles

**Testing:** Test animations, verify smooth transitions, test responsive breakpoints

**Dependencies:** Phase 1, Phase 2

---

### Phase 4: Story Event Player

**Goal:** Create orchestrator for multi-character story event sequences

**Files:**

- `lib/dialogue/StoryEventPlayer.ts` (new)

**Tasks:**

1. Create StoryEventPlayer class with DialogueManager dependency
2. Implement `loadStoryEvent()` method (takes eventId string)
3. Implement `start()`, `next()`, `advance()` methods
4. Add text chunking logic:

   - Use `dialogueManager.getConfig()` to get text limits
   - Actual limits: mobile 120, tablet 200, desktop 300 (from config)
   - Implement chunking by sentence boundaries

5. **Character data resolution (CRITICAL):**

   - Story events have `dialogue[].speaker` = character ID (e.g., "archivist-lumina")
   - Story events have `characters[]` array with minimal info: `{id, portraitFile}` only
   - Character JSON files have full data: `{id, name, title, description, portraitFile, ...}`
   - **Resolution process:**

a. Get character ID from `dialogueData.speaker`

b. Look up full CharacterData via `dialogueManager.getCharacterById(characterId)`

c. If character not found in DialogueManager, log error and skip dialogue entry

d. Use portraitFile from story event's characters array (may differ from character file)

e. Create DialogueEntry with full character data (name, title) + story event portraitFile

6. Add portrait preloading for story event characters
7. Add event callbacks (onDialogue, onComplete)
8. Handle pauseAfter timing for auto-advancement (future)
9. Track current sequence position

**Character Lookup Example:**

```typescript
const dialogueData = storyEvent.dialogue[currentSequence];
const characterId = dialogueData.speaker; // "archivist-lumina"
const fullCharacterData = dialogueManager.getCharacterById(characterId);

if (!fullCharacterData) {
  console.error(`Character ${characterId} not found in DialogueManager`);
  // Skip this dialogue entry
  return null;
}

// Get portraitFile from story event (may override character file)
const storyEventChar = storyEvent.characters.find(c => c.id === characterId);
const portraitFile = storyEventChar?.portraitFile || fullCharacterData.character.portraitFile;

// Create entry with full character data
const entry: DialogueEntry = {
  id: `${storyEvent.id}-${currentSequence}`,
  character: {
    ...fullCharacterData.character,
    portraitFile // Use story event portrait if provided
  },
  text: dialogueData.text,
  emotion: dialogueData.emotion[0], // Use first emotion
  chunks: this.chunkText(dialogueData.text),
  currentChunk: 0
};
```

**Testing:** Test with sample story event, verify chunking, test character lookup, test missing character handling, test callbacks

**Dependencies:** Phase 6 (DialogueManager enhancements - getCharacterById is critical)

---

### Phase 5: Library Page Integration

**Goal:** Replace hardcoded dialogue with new system

**Files:**

- `app/library/page.tsx` (modify)
- `app/library/library.module.css` (cleanup)

**Tasks:**

1. Import DialogueQueue, DialogueControls, StoryEventPlayer
2. Import useDialogue hook and useStoryNotification hook
3. Add conversation state management (conversationActive, eventPlayer, currentEventId)
4. Update `handleStartConversation()`:

   - Use `dialogueManager.getAvailableStoryEvent(currentBeat)` to get first available event
   - If available: load and start StoryEventPlayer with event ID
   - Store eventId for completion tracking
   - If not: show random banter:
     - Call `dialogueManager.getRandomBanter(currentBeat)`
     - Get full character data via `dialogueManager.getCharacterById(banterResult.dialogue.characterId)`
     - Create DialogueEntry with full character data

5. Replace hardcoded dialogue UI (lines 210-228) with DialogueQueue
6. Connect Continue button to queue's handleContinue
7. Handle story event completion:

   - When StoryEventPlayer.onComplete fires, mark event as completed in game state
   - Clear notification via `clearNewDialogue()` from useStoryNotification
   - This prevents event from triggering again via StoryEventTriggerChecker

8. Add cleanup on conversation end
9. Remove old dialogue styles from library.module.css

**Integration Notes:**

- StorySystemProvider listens to `dialogueManager:storyEventAvailable` events
- When we complete an event, it should NOT trigger notification again
- Library page already calls `clearNewDialogue()` when starting conversation (line 183)
- Need to ensure completed events are tracked in game state (Phase 7)

**Testing:** Test story event playback, test random banter fallback, test conversation end, verify notification clears

**Dependencies:** Phase 2, Phase 3, Phase 4, Phase 6

---

### Phase 6: DialogueManager Enhancements

**Goal:** Add missing methods needed for multi-character dialogue system

**Files:**

- `lib/dialogue/DialogueManager.ts` (modify)

**Tasks:**

1. Add `getCharacterById(characterId: string): CharacterData | null` method

   - Access internal characters Map to return full CharacterData
   - Needed for story events (character lookup) and banter (full character info)

2. Add `getAvailableStoryEvent(currentBeat?: StoryBeat): StoryEvent | null` method

   - Returns first available story event (uses existing getAvailableStoryEvents()[0])
   - Checks completion status if game state integration exists
   - Returns full StoryEvent object, not just ID

3. Add `getConfig(): DialogueConfig | null` method

   - Returns current config for text chunking limits
   - Already exists as private, make it public

**Testing:** Test character lookup, test story event retrieval, verify config access

**Dependencies:** None (can be done early)

---

### Phase 7: Enhanced State Management

**Goal:** Integrate dialogue state with game state for persistence

**Files:**

- `lib/game/state.ts` (modify)
- `lib/dialogue/DialogueManager.ts` (modify - integrate with state)
- `lib/save/optimizedSaveSystem.ts` (modify - add dialogue state to save format)

**Tasks:**

1. Add DialogueState interface to game state:

   - `completedStoryEvents: string[]` - Array of completed event IDs
   - `conversationHistory: DialogueHistoryEntry[]` - Optional history tracking
   - `lastCharacters: string[]` - Track recently used characters (already tracked internally)

2. Add dialogue state to GameState interface (as optional field initially)
3. Add dialogue actions (startConversation, recordDialogue, completeStoryEvent, etc.)
4. Add reducer cases for dialogue state updates
5. Update DialogueManager to sync with game state (setGameState method)
6. Update `getAvailableStoryEvent()` to check completed events from state:

   - Filter out events that are in `completedStoryEvents` array
   - This prevents StoryEventTriggerChecker from re-triggering completed events

7. Track completed story events when StoryEventPlayer finishes
8. Track conversation history (optional, for future features)
9. **Save System Integration:**

   - Add `dl?: string[]` field to `OptimizedProgress` interface (compact name for dialogue/completed events)
   - Update `saveOptimizedProgress()` to save `completedStoryEvents` array
   - Update `loadOptimizedProgress()` to restore `completedStoryEvents` array
   - Add migration logic if needed (should be backward compatible as optional field)

**Integration Notes:**

- StoryEventTriggerChecker uses `dialogueManager.getAllStoryEvents()` - our filtering happens in `getAvailableStoryEvent()`
- StorySystemProvider listens to `dialogueManager:storyEventAvailable` - this won't fire for completed events
- Library page checks for available events on load (lines 35-64) - needs to respect completed events
- Save system uses optimized format - add dialogue state as optional field `dl` (compact name)
- Portrait paths: `/images/portraits/` + `portraitFile` (e.g., "lumina-portrait.svg")
- Story event structure confirmed: dialogue array with sequence, speaker, text, emotion, pauseAfter

**Testing:** Verify state updates, test persistence, verify story event availability logic, verify completed events don't re-trigger, verify save/load works

**Dependencies:** Phase 6

---

### Phase 8: Testing & Polish

**Goal:** Comprehensive testing and bug fixes

**Files:**

- `cypress/e2e/multi-character-dialogue.cy.ts` (new)

**Tasks:**

1. Create Cypress test suite
2. Test panel display (1 panel, 2 panels, max 2 limit)
3. Test animations (entering, shifting, exiting)
4. Test text chunking advancement
5. Test story event playback sequence
6. Test portrait loading and error handling
7. Test emotion styling
8. Test accessibility (keyboard nav, screen readers)
9. Test mobile responsiveness
10. Manual testing checklist completion
11. Performance testing
12. Bug fixes and refinements

**Dependencies:** All previous phases

---

## Critical Implementation Details

### DialogueManager Integration Notes

**Character Data Access:**

- `getRandomBanter()` returns character name as string, not full CharacterData
- Must call `getCharacterById(characterId)` to get full character info (name, title, portraitFile, etc.)
- **Story Event Character Resolution:**
  - Story events have `dialogue[].speaker` = character ID (e.g., "archivist-lumina")
  - Story events have `characters[]` array with ONLY `{id, portraitFile}` - minimal info
  - Full character data (name, title, description) is in character JSON files
  - Must look up full CharacterData via `getCharacterById(speaker)` 
  - Use portraitFile from story event's characters array (may override character file)
  - If character not found in DialogueManager, dialogue entry cannot be created

**Story Event Methods:**

- `getAvailableStoryEvents(beat)` returns string[] of event IDs
- `getStoryEvent(eventId)` returns full StoryEvent object
- Plan needs `getAvailableStoryEvent()` (singular) - add in Phase 6 to return first available event
- Must filter out completed events (from game state) to prevent re-triggering

**Text Limits:**

- Actual config values: mobile 120, tablet 200, desktop 300 (not 150/250 as originally noted)
- Access via `dialogueManager.getConfig().display.textLimits.{device}.maxCharsPerScreen`

### External System Integrations

**StorySystemProvider:**

- Listens to `dialogueManager:storyEventAvailable` events
- Calls `setNewDialogueAvailable()` to trigger library button glow
- Our system should NOT emit this event for completed events

**StoryNotificationContext:**

- Manages `hasNewDialogue` state
- Library page calls `clearNewDialogue()` when starting conversation (line 183)
- Should also clear when story event completes

**StoryProgressionManager:**

- Calls `dialogueManager.setStoryBeat()` which emits `dialogueManager:beatChanged`
- Listens to beatChanged events for coordination
- No direct impact on our system, but story beat affects event availability

**StoryEventTriggerChecker:**

- Uses `dialogueManager.getAllStoryEvents()` to check triggers
- Indexes events by story beat for performance
- Checks events against game state transitions
- Our `getAvailableStoryEvent()` should filter completed events before returning
- This prevents checker from finding events that are already done

### Continue Button Behavior

The Continue button MUST only advance the bottom panel:

1. If bottom panel has more chunks → show next chunk
2. If bottom panel complete → advance to next dialogue entry

### Text Chunking

- Use `dialogue-config.json` text limits (mobile: 120, tablet: 200, desktop: 300)
- Access via `dialogueManager.getConfig().display.textLimits`
- Chunk by sentence boundaries
- Pre-calculate chunks when dialogue entry is created
- Display chunk indicator (e.g., "2/4")

### Animation Coordination

- When adding 3rd dialogue: top panel exits, bottom shifts up, new enters
- Use transition lock to prevent rapid clicks
- Animation duration: 500ms with 100ms stagger

### Edge Cases

- Rapid Continue clicks → disable button during transitions
- Missing portraits → show placeholder with initial
- Very long text → make text area scrollable
- Story event completion → fade out and save to state

## File Structure

**New Files:**

```
components/dialogue/
├── DialoguePanel.tsx
├── DialogueQueue.tsx
├── DialogueControls.tsx
└── dialogue.module.css

lib/dialogue/
└── StoryEventPlayer.ts

cypress/e2e/
└── multi-character-dialogue.cy.ts
```

**Modified Files:**

```
app/library/page.tsx (integrate DialogueQueue, handle notifications)
app/library/library.module.css (cleanup old styles)
lib/game/state.ts (add dialogue state, completed events tracking)
lib/dialogue/DialogueManager.ts (add getCharacterById, getAvailableStoryEvent, getConfig, setGameState)
lib/save/optimizedSaveSystem.ts (add dialogue state to save format)
```

**Integration Points:**

- StorySystemProvider (listens to storyEventAvailable events)
- StoryNotificationContext (manages hasNewDialogue state)
- StoryProgressionManager (coordinates story beat changes)
- StoryEventTriggerChecker (checks event triggers against state)

## Success Criteria

- [ ] Two dialogue panels display simultaneously
- [ ] New panels slide in from bottom smoothly
- [ ] Old panels slide out when third dialogue appears
- [ ] Continue button advances chunks first, then dialogue
- [ ] Text chunking works correctly
- [ ] Character portraits load and display
- [ ] Story events play multi-character sequences
- [ ] Animations are smooth (no jank)
- [ ] Mobile, tablet, desktop layouts work
- [ ] Accessibility requirements met
- [ ] All tests pass