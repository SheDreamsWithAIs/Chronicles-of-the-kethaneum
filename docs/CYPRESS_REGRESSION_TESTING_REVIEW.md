# Cypress Regression Testing Review & Recommendations

**Date:** 2025-11-28
**Project:** Chronicles of the Kethaneum
**Branch:** `claude/cypress-regression-testing-01Y6Z1cDBR42pHbtMuZhnoeP`

---

## Table of Contents
1. [Current Test Suite Review](#current-test-suite-review)
2. [Book of Passage System Testing](#book-of-passage-system-testing)
3. [Dialogue System Testing](#dialogue-system-testing)
4. [Audio System Testing](#audio-system-testing)
5. [Priority Matrix](#priority-matrix)
6. [Implementation Phases](#implementation-phases)
7. [Test Utilities Needed](#test-utilities-needed)
8. [Additional Resources](#additional-resources)

---

## Current Test Suite Review

### Existing Test Files

| Test File | Purpose | Status | Notes |
|-----------|---------|--------|-------|
| `basic-game-flow.cy.ts` | Core navigation and game flow | ✅ Active | Covers title → backstory → mode selection → puzzle |
| `game-saving.cy.ts` | Save/load functionality | ✅ Active | Tests localStorage persistence across sessions |
| `dialogue-system.cy.ts` | Basic dialogue UI | ✅ Active | Tests dialogue panel interactions in Library |
| `word-search-completion.cy.ts` | Puzzle completion | ✅ Active | Uses word-finder utility to complete puzzles |
| `mobile-viewport.cy.ts` | Responsive design | ✅ Active | Tests multiple viewport sizes and touch interactions |
| `word-selection-debug.cy.ts` | Word selection mechanics | ✅ Active | Debug test for word selection |

### Test Coverage Strengths
- ✅ Well-structured with consistent use of `data-testid` attributes
- ✅ Comprehensive game flow from title to puzzle
- ✅ Excellent mobile responsiveness testing (5 different viewports)
- ✅ Good save/load state persistence testing
- ✅ Custom commands for common operations (`clearGameProgress`, `startNewGame`, etc.)
- ✅ Word-finder utility for automated puzzle completion

### Known Gaps
- ⚠️ **Puzzle Only mode tests skipped** (mode broken, post-alpha fix)
- ⚠️ **Beat the Clock mode tests skipped** (mode broken, post-alpha fix)
- ❌ No audio system testing
- ❌ Limited story progression validation
- ❌ Book series progression not tested
- ❌ Kethaneum weaving pattern not tested
- ❌ Story beat advancement not tested
- ❌ Character availability changes not tested

---

## Book of Passage System Testing

### System Architecture Summary

The Book of Passage system is a sophisticated multi-part book tracking system with:
- **Book Registry** - Centralized metadata (compact IDs like "K001", "N001")
- **Progress Bitmap** - Compact storage using bitwise operations (70-80% storage reduction)
- **Story Progress** - 8-beat narrative structure with 40+ trigger types
- **Puzzle Selector** - Handles book series continuation and Kethaneum weaving
- **State Management** - Tracks discovered books, completion status, and current progress

### Critical Flows to Test

#### 1. Book Series Progression ⭐ **HIGHEST PRIORITY**

**Test File:** `cypress/e2e/book-series-progression.cy.ts`

```typescript
describe('Book Series Progression', () => {
  it('should continue same book across multiple puzzles', () => {
    // SCENARIO: Multi-part book continuation
    // 1. Complete part 0 of a multi-part book (e.g., "Nature's Wisdom Part 1")
    // 2. Verify gameState.currentBook preserved after puzzle completion
    // 3. Start next puzzle
    // 4. Verify puzzle is part 1 of SAME book (not random book)
    // 5. Complete part 1
    // 6. Verify part 2 loads next
    // 7. Continue through all parts
    //
    // ASSERTION: No random book switching between parts
    // CHECKS:
    //   - currentBook value preserved in state
    //   - bookProgress[currentBook] increments
    //   - selectNextPuzzle() respects currentBook
  });

  it('should track parallel progress across multiple books', () => {
    // SCENARIO: Working on multiple books simultaneously
    // 1. Start Book A (e.g., "The Forest Chronicles") part 0
    // 2. Complete it → verify Book A in discoveredBooks
    // 3. Start Book B (e.g., "Ocean Tales") part 0
    // 4. Complete it → verify Book B in discoveredBooks
    // 5. Return to Book A, complete part 1
    // 6. Return to Book B, complete part 1
    //
    // ASSERTION: Both books tracked independently
    // CHECKS:
    //   - books[Book A] array has [true, true, false, ...]
    //   - books[Book B] array has [true, true, false, ...]
    //   - bookProgress maintains separate indices
    //   - Can switch between books without losing progress
  });

  it('should preserve currentBook after puzzle completion', () => {
    // SCENARIO: Critical state preservation bug prevention
    // 1. Start puzzle from Book X
    // 2. Complete puzzle successfully
    // 3. Immediately check gameState.currentBook
    //
    // ASSERTION: currentBook still equals Book X (not null/undefined)
    // RATIONALE: Recent commit fixes this - regression test needed
    // REFERENCE: "Preserve currentBook when puzzle completed to continue series"
  });
});
```

#### 2. Book Discovery & Completion

**Test File:** `cypress/e2e/book-discovery.cy.ts`

```typescript
describe('Book Discovery System', () => {
  it('should add book to discoveredBooks on first puzzle completion', () => {
    // FLOW:
    // 1. Start new game (discoveredBooks = empty Set)
    // 2. Navigate to puzzle from Book X
    // 3. Complete puzzle
    // 4. Verify Book X added to discoveredBooks Set
    // 5. Verify story trigger "first_book_discovered" fires
    // 6. Navigate to Book of Passage
    // 7. Verify Book X visible in "Discovered Books" tab
    //
    // KEY CHECKS:
    //   - discoveredBooks.size === 1
    //   - discoveredBooks.has(Book X title)
    //   - Story blurb unlocked
    //   - UI reflects discovery
  });

  it('should detect book completion when all parts done', () => {
    // FLOW:
    // 1. Find book with 3 parts (check bookPartsMap)
    // 2. Complete part 0 → books[title][0] = true
    // 3. Complete part 1 → books[title][1] = true
    // 4. Complete part 2 → books[title][2] = true
    // 5. Verify checkBookCompletion(title) returns true
    // 6. Verify story trigger "first_book_complete" fires
    // 7. Check book marked complete in Book of Passage UI
    //
    // KEY CHECKS:
    //   - All parts in bookPartsMap[title] are true
    //   - Completion percentage = 100%
    //   - Story milestone triggered
  });

  it('should handle both array and object completion formats', () => {
    // SCENARIO: Legacy data format compatibility
    //
    // FORMAT 1 (Array): books[title] = [true, true, true]
    // FORMAT 2 (Object): books[title] = { complete: true }
    //
    // TEST:
    // 1. Mock state with array format
    // 2. Verify checkBookCompletion detects completion
    // 3. Mock state with object format
    // 4. Verify checkBookCompletion detects completion
    // 5. Test mixed format (some books array, some object)
    //
    // RATIONALE: System converts formats during save/load
  });

  it('should calculate completion percentage correctly', () => {
    // SCENARIO: Progress display accuracy
    // 1. Book with 5 parts
    // 2. Complete parts [0, 2, 4] → 3/5 = 60%
    // 3. Verify Book of Passage shows 60%
    // 4. Complete part 1 → 4/5 = 80%
    // 5. Verify updates to 80%
    // 6. Complete part 3 → 5/5 = 100%
    // 7. Verify shows "Complete"
  });
});
```

#### 3. Kethaneum Weaving System ⭐ **HIGH PRIORITY**

**Test File:** `cypress/e2e/kethaneum-weaving.cy.ts`

```typescript
describe('Kethaneum Weaving Pattern', () => {
  it('should insert Kethaneum puzzle after interval', () => {
    // SYSTEM: Kethaneum puzzles weave into genre puzzles every 2-5 puzzles
    //
    // FLOW:
    // 1. Start new game
    // 2. Track puzzlesSinceLastKethaneum counter (starts at 0)
    // 3. Check nextKethaneumInterval (random 2-5)
    // 4. Complete genre puzzles until counter >= interval
    // 5. Verify next puzzle is Kethaneum genre
    // 6. Verify counter resets to 0
    // 7. Verify new interval randomized (2-5 range)
    //
    // CHECKS:
    //   - currentGenre === 'Kethaneum' after threshold
    //   - puzzlesSinceLastKethaneum === 0 after Kethaneum
    //   - nextKethaneumInterval is random (not fixed)
  });

  it('should play Kethaneum books in sequential order', () => {
    // CRITICAL: Kethaneum books play K001 → K002 → K003 (NOT random)
    //
    // FLOW:
    // 1. Trigger first Kethaneum insertion
    // 2. Verify puzzle is from K001 (first Kethaneum book)
    // 3. Complete puzzle
    // 4. Trigger second Kethaneum insertion (complete more genre puzzles)
    // 5. Verify puzzle is from K002 (not random, not K001 again)
    // 6. Trigger third
    // 7. Verify K003
    //
    // CHECKS:
    //   - nextKethaneumIndex increments: 0 → 1 → 2
    //   - Sequential order maintained
    //   - No repetition or randomization
  });

  it('should reveal Kethaneum genre after first encounter', () => {
    // FLOW:
    // 1. Start new game
    // 2. Verify kethaneumRevealed === false
    // 3. Verify Kethaneum not visible in genre selection
    // 4. Complete puzzles until first Kethaneum appears
    // 5. Complete Kethaneum puzzle
    // 6. Verify kethaneumRevealed === true
    // 7. Verify story trigger "kethaneum_genre_revealed" fires
    // 8. Navigate to genre selection
    // 9. Verify Kethaneum genre now visible
  });

  it('should handle Kethaneum exhaustion gracefully', () => {
    // SCENARIO: All Kethaneum books completed
    // 1. Mock state with all Kethaneum books done
    // 2. Trigger Kethaneum insertion
    // 3. Verify falls through to genre puzzle selection
    // 4. Verify no error/crash
    // 5. Genre puzzles continue normally
  });
});
```

#### 4. Progress Bitmap System

**Test File:** `cypress/e2e/book-progress-bitmap.cy.ts`

```typescript
describe('Progress Bitmap Storage', () => {
  it('should convert legacy array format to bitmap on save', () => {
    // OPTIMIZATION: Bitmap reduces storage by 70-80%
    //
    // LEGACY: books[title] = [true, false, true, false, true]
    // BITMAP: bookProgress[bookId] = 21 (binary: 10101)
    //
    // FLOW:
    // 1. Create game state with legacy array format
    // 2. Trigger save (optimized save system)
    // 3. Check localStorage "kethaneumProgress"
    // 4. Verify bookProgress contains number (bitmap)
    // 5. Verify NOT array
    // 6. Calculate expected storage size vs legacy
    // 7. Verify ~70% reduction
  });

  it('should correctly restore bitmap to boolean arrays', () => {
    // FLOW:
    // 1. Set localStorage with bitmap format
    //    Example: { bookProgress: { "N001": 21 } }
    // 2. Reload game
    // 3. Verify books["Nature Title"] = [true, false, true, false, true]
    // 4. Verify completion percentage accurate
    // 5. Verify parts checkable via isPartCompleted()
  });

  it('should sanitize out-of-range bits', () => {
    // EDGE CASE: Corrupted data with invalid high bits
    //
    // SCENARIO:
    // 1. Book has 5 parts (bits 0-4 valid)
    // 2. Bitmap has bits 0-10 set (invalid bits 5-10)
    // 3. Load state
    // 4. Verify sanitizeBitmap() clears bits 5-10
    // 5. Verify only bits 0-4 remain
    // 6. Verify no UI corruption (100%+ progress)
  });

  it('should handle bitmap encode/decode roundtrip', () => {
    // VALIDATION: No data loss in conversion
    //
    // TEST CASES:
    // 1. [true, false, true] → encode → decode → [true, false, true]
    // 2. All true: [true, true, true, true] → 15 → [true, true, true, true]
    // 3. All false: [false, false] → 0 → [false, false]
    // 4. Max 32 parts (bit limit)
    //
    // ASSERTIONS:
    //   - Original === Decoded
    //   - No bit corruption
    //   - Edge cases (0, max) work
  });
});
```

#### 5. Genre Exhaustion Cycle

**Test File:** `cypress/e2e/genre-exhaustion.cy.ts`

```typescript
describe('Genre Exhaustion & Reset', () => {
  it('should reset genre when all puzzles completed', () => {
    // FLOW:
    // 1. Select genre with small puzzle count (e.g., 5 puzzles)
    // 2. Complete all 5 puzzles in genre
    // 3. Attempt to select next puzzle in same genre
    // 4. Verify genreExhausted flag set to true
    // 5. Verify completedPuzzlesByGenre[genre] Set cleared
    // 6. Verify notification displayed to player
    // 7. Next puzzle selection works (from reset pool)
    // 8. All 5 puzzles available again
  });

  it('should not reset Kethaneum exhaustion', () => {
    // SPECIAL CASE: Kethaneum doesn't reset like genres
    // 1. Complete all Kethaneum books
    // 2. Trigger Kethaneum insertion
    // 3. Verify doesn't reset
    // 4. Falls through to genre selection
  });
});
```

#### 6. Save/Load State Preservation

**Test File:** `cypress/e2e/book-state-persistence.cy.ts`

```typescript
describe('Book State Persistence', () => {
  it('should preserve book progress across page reloads', () => {
    // 1. Complete part 0 and part 1 of Book A
    // 2. Complete part 0 of Book B
    // 3. Reload page
    // 4. Verify books[Book A] = [true, true, false, ...]
    // 5. Verify books[Book B] = [true, false, ...]
    // 6. Verify discoveredBooks contains both
    // 7. Verify bookProgress points to correct next parts
  });

  it('should restore discoveredBooks Set from localStorage', () => {
    // TECHNICAL: Sets don't serialize to JSON directly
    // System converts Set → Array on save, Array → Set on load
    //
    // TEST:
    // 1. Discover books A, B, C
    // 2. Save game
    // 3. Check localStorage has array ["A", "B", "C"]
    // 4. Reload
    // 5. Verify discoveredBooks is Set (not array)
    // 6. Verify Set.has("A"), Set.has("B"), Set.has("C")
  });

  it('should migrate legacy save format to optimized format', () => {
    // BACKWARD COMPATIBILITY
    //
    // V1 (Legacy): Full arrays for all books
    // V2 (Optimized): Bitmaps + compact book IDs
    //
    // TEST:
    // 1. Load game with v1 format in localStorage
    // 2. Verify loads successfully
    // 3. Make any state change
    // 4. Trigger save
    // 5. Verify localStorage now has v2 format
    // 6. Verify data integrity (no loss)
  });
});
```

---

## Dialogue System Testing

### System Architecture Summary

Two subsystems:
1. **Banter Dialogue** - Random character dialogue in Library (DialogueManager)
2. **Story Progress** - Narrative blurbs unlocked by milestones (StoryProgressManager)

**Key Components:**
- Dialogue config (`/public/data/dialogue-config.json`)
- Character manifest & files (`/public/data/characters/`)
- Story progress data (`/public/data/story-progress.json`)
- 8 story beats: hook → first_plot_point → ... → resolution
- 40+ trigger types for story milestones
- Weighted character selection (recent avoidance)
- Loading groups for character availability

### Critical Gaps Beyond Current Tests

Current `dialogue-system.cy.ts` covers:
- ✅ Navigation to Library
- ✅ "Start a Conversation" button
- ✅ Dialogue panel display
- ✅ Close mechanisms (X, Continue, overlay)
- ✅ Character name/text display
- ✅ Multiple dialogue opens

**Missing tests:**

#### 1. Story Beat Progression

**Test File:** `cypress/e2e/dialogue-story-beats.cy.ts`

```typescript
describe('Story Beat Dialogue Availability', () => {
  it('should filter dialogue by story beat range', () => {
    // SCENARIO: Dialogue has availableFrom and availableUntil
    //
    // SETUP:
    // - Dialogue A: availableFrom='hook', availableUntil='first_plot_point'
    // - Dialogue B: availableFrom='midpoint', availableUntil='resolution'
    //
    // TEST:
    // 1. Set story beat to 'hook'
    // 2. Call getRandomBanter()
    // 3. Verify only Dialogue A eligible (not B)
    // 4. Advance story beat to 'midpoint'
    // 5. Call getRandomBanter()
    // 6. Verify only Dialogue B eligible (A now expired)
  });

  it('should handle missing availableUntil as indefinite', () => {
    // EDGE CASE: No end restriction
    //
    // DIALOGUE: availableFrom='hook', availableUntil=undefined
    //
    // TEST:
    // 1. Set beat to 'hook' → dialogue available ✓
    // 2. Set beat to 'midpoint' → still available ✓
    // 3. Set beat to 'resolution' → still available ✓
  });

  it('should warn on invalid story beat values', () => {
    // ERROR HANDLING:
    // 1. Mock dialogue with availableFrom='invalid_beat'
    // 2. Load dialogue system
    // 3. Verify console warning logged
    // 4. Verify dialogue skipped (not crash)
  });
});
```

#### 2. Character System Integration

**Test File:** `cypress/e2e/dialogue-character-system.cy.ts`

```typescript
describe('Character Loading & Availability', () => {
  it('should load introduction_characters on init', () => {
    // CURRENT IMPLEMENTATION: Only introduction_characters loads automatically
    //
    // TEST:
    // 1. Initialize DialogueManager
    // 2. Verify Archivist Lumina loaded
    // 3. Check character.loadingGroup === 'introduction_characters'
    // 4. Verify character data structure valid:
    //    - Has id, name, title, description
    //    - Has banterDialogue array
    //    - Has metadata
  });

  it('should apply weighted selection to prevent repeats', () => {
    // ALGORITHM: Recently used (last 3) = weight 1, others = weight 3
    // EXPECTED: ~25% chance recent, ~75% chance others
    //
    // TEST:
    // 1. Load 3+ characters
    // 2. Call getRandomBanter() → Character A
    // 3. Call again 10 times
    // 4. Verify Character A appears in ~25% of results
    // 5. Verify others appear more frequently
    // 6. Verify no immediate repeat (window = 3)
  });

  it('should handle character retirement at story beats', () => {
    // FEATURE: Characters can retire (become unavailable)
    //
    // SCENARIO:
    // - Visiting Scholar: retireAfter='second_plot_point'
    //
    // TEST:
    // 1. Load visiting_scholars group (mock if needed)
    // 2. Set beat to 'midpoint' (before retirement)
    // 3. Verify character available
    // 4. Advance to 'second_plot_point'
    // 5. Verify character excluded from getAvailableCharacters()
    // 6. Verify getRandomBanter() doesn't return retired character
  });

  it('should gracefully handle missing character files', () => {
    // ERROR RECOVERY:
    //
    // SCENARIO:
    // 1. Mock character-manifest.json with ["existing.json", "missing.json"]
    // 2. Initialize system
    // 3. Verify loads existing.json successfully
    // 4. Verify logs error for missing.json
    // 5. Verify system continues (doesn't crash)
    // 6. Verify existing character available for dialogue
  });

  it('should validate character structure', () => {
    // DATA INTEGRITY:
    //
    // INVALID CHARACTER (missing required fields):
    // { character: { id: "test" } } // missing name, title, etc.
    //
    // TEST:
    // 1. Load character with incomplete structure
    // 2. Verify validation fails
    // 3. Verify character skipped
    // 4. Verify error logged
  });
});
```

#### 3. Story Progress Trigger System ⭐ **HIGH PRIORITY**

**Test File:** `cypress/e2e/story-progress-triggers.cy.ts`

```typescript
describe('Story Progress Trigger System', () => {
  it('should fire first_book_discovered trigger', () => {
    // FLOW:
    // 1. Start new game (unlockedBlurbs = [])
    // 2. Complete puzzle from Book A
    // 3. Verify checkTriggerConditions() called
    // 4. Verify trigger='first_book_discovered' detected
    // 5. Verify blurb unlocked (added to unlockedBlurbs)
    // 6. Navigate to Book of Passage
    // 7. Verify blurb displayed in "Current Journey" tab
  });

  it('should fire milestone triggers at thresholds', () => {
    // MILESTONES:
    // - books_discovered_5: When 5 books discovered
    // - books_discovered_10, _25, _50, _100
    // - puzzles_complete_10, _25, _50, _100
    // - books_complete_5, _10, _25
    //
    // TEST CASE (books_discovered_5):
    // 1. Mock state with 4 discovered books
    // 2. Discover 5th book (complete puzzle)
    // 3. Verify trigger='books_discovered_5' fires
    // 4. Verify specific blurb for this milestone unlocked
    // 5. Verify trigger added to firedTriggers array
    //
    // REPEAT for other milestones
  });

  it('should prevent duplicate trigger firing', () => {
    // DEDUPLICATION:
    //
    // FLOW:
    // 1. Complete first puzzle → first_puzzle_complete fires
    // 2. Verify trigger in firedTriggers array
    // 3. Complete second puzzle
    // 4. Verify checkTriggerConditions() checks firedTriggers
    // 5. Verify first_puzzle_complete doesn't fire again
    // 6. Verify only one blurb for this trigger
  });

  it('should check triggers in priority order', () => {
    // PRIORITY ORDER:
    // 1. game_start
    // 2. first_book_discovered
    // 3. first_puzzle_complete
    // 4. first_book_complete
    // 5-7. Milestone triggers
    // 8. kethaneum triggers
    //
    // SCENARIO: Multiple eligible triggers
    // 1. Set up state where:
    //    - First book discovered (trigger eligible)
    //    - First puzzle complete (trigger eligible)
    // 2. Call checkTriggerConditions()
    // 3. Verify first_book_discovered wins (higher priority)
    // 4. Verify only one trigger fires (not both)
  });

  it('should unlock Kethaneum revelation trigger', () => {
    // SPECIAL: Kethaneum genre revealed after first encounter
    //
    // FLOW:
    // 1. Complete genre puzzles until Kethaneum appears
    // 2. Complete Kethaneum puzzle
    // 3. Verify trigger='kethaneum_genre_revealed' fires
    // 4. Verify blurb unlocked
    // 5. Verify kethaneumRevealed flag set
  });
});
```

#### 4. Dialogue Data Loading

**Test File:** `cypress/e2e/dialogue-data-loading.cy.ts`

```typescript
describe('Dialogue Data Loading & Validation', () => {
  it('should load dialogue-config.json on init', () => {
    // 1. Initialize DialogueManager
    // 2. Verify config.loaded === true
    // 3. Verify config.storyStructure.storyBeats array populated (8 beats)
    // 4. Verify config.loadingGroups defined (9 groups)
    // 5. Verify config.behavior.selectionMethod set
  });

  it('should fallback to hardcoded config on fetch failure', () => {
    // ERROR RECOVERY:
    //
    // 1. Mock fetch('/data/dialogue-config.json') to fail
    // 2. Initialize system
    // 3. Verify fallback config used
    // 4. Verify system functional (can get dialogue)
    // 5. Verify warning logged
  });

  it('should load character manifest', () => {
    // 1. Initialize
    // 2. Verify fetches /data/characters/character-manifest.json
    // 3. Verify manifest.characters array loaded
    // 4. Verify each file in manifest loaded
  });

  it('should fallback to default character on manifest failure', () => {
    // FALLBACK: ['archivist-lumina.json']
    //
    // 1. Mock manifest fetch failure
    // 2. Initialize
    // 3. Verify loads only archivist-lumina.json
    // 4. Verify system functional with single character
  });
});
```

---

## Audio System Testing

### System Architecture Summary

**Singleton-based centralized audio management:**
- AudioManager singleton (all audio logic)
- useAudio hook (React wrapper)
- AudioProvider (app initialization)
- 4 categories: MUSIC, AMBIENT, SFX, VOICE
- Playlist system (sequential, shuffle, repeat modes)
- Persistent settings (localStorage)

### Critical Test Scenarios

#### 1. Settings Persistence

**Test File:** `cypress/e2e/audio-settings-persistence.cy.ts`

```typescript
describe('Audio Settings Persistence', () => {
  it('should save audio settings to localStorage', () => {
    // FLOW:
    // 1. Open audio settings modal (if UI exists)
    // 2. Change master volume to 0.5
    // 3. Change music volume to 0.3
    // 4. Mute SFX
    // 5. Save settings
    // 6. Check localStorage key 'kethaneumAudioSettings'
    // 7. Verify JSON contains:
    //    { masterVolume: 0.5, musicVolume: 0.3, sfxMuted: true, ... }
  });

  it('should load saved settings on app restart', () => {
    // 1. Set custom audio settings
    // 2. Trigger save (or wait 5 seconds for auto-save)
    // 3. Reload page
    // 4. Verify AudioManager initialized with saved settings
    // 5. Verify master volume = 0.5 (from previous test)
    // 6. Verify music volume = 0.3
    // 7. Verify SFX muted
  });

  it('should apply defaults if no saved settings', () => {
    // DEFAULTS:
    // - masterVolume: 0.7
    // - musicVolume: 0.8
    // - ambientVolume: 0.6
    // - sfxVolume: 0.7
    // - voiceVolume: 1.0
    // - all muted: false
    //
    // TEST:
    // 1. Clear localStorage
    // 2. Reload app
    // 3. Verify AudioManager settings match defaults
  });

  it('should auto-save settings every 5 seconds', () => {
    // INTERVAL: AudioProvider runs save every 5s
    //
    // 1. Change audio setting
    // 2. Wait 5 seconds
    // 3. Verify localStorage updated
    // 4. Verify no earlier save (debounced)
  });
});
```

#### 2. Volume & Mute Controls

**Test File:** `cypress/e2e/audio-volume-mute.cy.ts`

```typescript
describe('Audio Volume & Mute Controls', () => {
  it('should update master volume affecting all categories', () => {
    // CALCULATION: finalVolume = masterVolume × categoryVolume
    //
    // SCENARIO:
    // - Master: 0.5
    // - Music: 0.8
    // - Expected music output: 0.5 × 0.8 = 0.4
    //
    // TEST:
    // 1. Set master volume to 0.5
    // 2. Set music volume to 0.8
    // 3. Mock play music track
    // 4. Verify audio element volume property = 0.4
    // 5. Change master to 1.0
    // 6. Verify music volume now = 0.8
  });

  it('should apply category volume independently', () => {
    // 1. Set music volume to 0.3
    // 2. Set sfx volume to 0.9
    // 3. Play music → verify volume = master × 0.3
    // 4. Play SFX → verify volume = master × 0.9
    // 5. Verify independent control
  });

  it('should override volume when muted', () => {
    // MUTE LOGIC: muted → effective volume = 0
    //
    // 1. Set music volume to 0.8
    // 2. Play music → verify playing at 0.8
    // 3. Mute music category
    // 4. Verify audio element volume = 0
    // 5. Unmute music
    // 6. Verify volume returns to 0.8
  });

  it('should have master mute override category mute', () => {
    // HIERARCHY: Master mute > category mute
    //
    // 1. Mute master (all audio off)
    // 2. Unmute music category
    // 3. Play music
    // 4. Verify volume still = 0 (master override)
    // 5. Unmute master
    // 6. Verify music now audible
  });

  it('should calculate final volume correctly', () => {
    // TEST MATRIX:
    // | Master | Category | Muted | Expected |
    // |--------|----------|-------|----------|
    // | 0.5    | 0.8      | No    | 0.4      |
    // | 0.5    | 0.8      | Yes   | 0.0      |
    // | 1.0    | 0.0      | No    | 0.0      |
    // | 0.0    | 1.0      | No    | 0.0      |
  });
});
```

#### 3. Audio Settings Modal UI

**Test File:** `cypress/e2e/audio-settings-modal.cy.ts`

```typescript
describe('Audio Settings Modal', () => {
  it('should open and close modal', () => {
    // NOTE: Modal UI component exists but may not be in main UI yet
    //
    // 1. Click audio settings button (if exists)
    // 2. Verify modal visible
    // 3. Click close button
    // 4. Verify modal closed
    // 5. Open again, click overlay
    // 6. Verify modal closed
  });

  it('should display current volume levels', () => {
    // 1. Set master volume to 0.7 via AudioManager
    // 2. Open settings modal
    // 3. Verify master slider shows 70% (0.7 → 70)
    // 4. Verify percentage display shows "70%"
  });

  it('should preview changes without saving', () => {
    // LOCAL STATE: Modal tracks changes before save
    //
    // 1. Open modal
    // 2. Move master slider to 50%
    // 3. Verify local state updates (slider position)
    // 4. Click Cancel
    // 5. Verify AudioManager unchanged (still 70%)
    // 6. Verify modal closed
  });

  it('should save changes on confirm', () => {
    // 1. Open modal
    // 2. Change master volume to 60%
    // 3. Change music volume to 40%
    // 4. Click Save
    // 5. Verify AudioManager.setVolume() called
    // 6. Verify settings persisted to localStorage
    // 7. Verify modal closes
  });

  it('should disable sliders when category muted', () => {
    // UX: Muted categories have disabled/grayed sliders
    //
    // 1. Open modal
    // 2. Mute music category
    // 3. Verify music slider disabled
    // 4. Verify slider opacity/color indicates disabled
    // 5. Unmute
    // 6. Verify slider enabled
  });

  it('should show mute button toggle state', () => {
    // 1. Unmuted: button shows "volume" icon
    // 2. Click mute button
    // 3. Verify icon changes to "muted" icon
    // 4. Verify button state reflects muted
  });
});
```

#### 4. Audio Context & Browser Compatibility

**Test File:** `cypress/e2e/audio-context.cy.ts`

```typescript
describe('Audio Context Handling', () => {
  it('should resume audio context on user interaction', () => {
    // BROWSER RESTRICTION: Audio blocked until user interaction
    //
    // FLOW:
    // 1. App loads (audio context suspended)
    // 2. User clicks anywhere
    // 3. AudioProvider.resumeAudioContext() called
    // 4. Verify context.state === 'running'
    // 5. Verify event listeners removed after first interaction
  });

  it('should handle audio context creation', () => {
    // COMPATIBILITY: AudioContext vs webkitAudioContext
    //
    // 1. Initialize AudioManager
    // 2. Verify audioContext created
    // 3. Check standard AudioContext OR webkitAudioContext
    // 4. Verify context state
  });

  it('should not block if audio context unavailable', () => {
    // GRACEFUL FALLBACK:
    //
    // 1. Mock AudioContext as undefined
    // 2. Initialize AudioManager
    // 3. Verify system continues (doesn't crash)
    // 4. Verify basic audio still works (HTML5 Audio element)
  });
});
```

#### 5. Playback Testing (Limited in Cypress)

**Test File:** `cypress/e2e/audio-playback.cy.ts`

```typescript
describe('Audio Playback (Mocked)', () => {
  // NOTE: Cypress can't test actual audio output
  // Tests verify method calls and state changes

  it('should preload audio track', () => {
    // 1. Call preload(id, src, MUSIC, true)
    // 2. Verify audio element created
    // 3. Verify src set
    // 4. Verify loop = true
    // 5. Verify stored in tracks Map
  });

  it('should play music with fade-in', () => {
    // 1. Preload track
    // 2. Call playMusic(id, 2000) // 2 second fade
    // 3. Verify audio.play() called
    // 4. Verify fade interval started (20 steps)
    // 5. Wait 2 seconds
    // 6. Verify volume reaches target
  });

  it('should stop current music before playing new', () => {
    // 1. Play music track A
    // 2. Play music track B
    // 3. Verify track A stopped (currentTime reset)
    // 4. Verify track B now playing
    // 5. Verify currentMusic = B
  });

  it('should clone SFX for overlapping playback', () => {
    // SFX SPECIAL: Can overlap with itself
    //
    // 1. Preload SFX
    // 2. Call playSFX(id) → play 1 starts
    // 3. Call playSFX(id) again → play 2 starts
    // 4. Verify 2 audio elements playing simultaneously
    // 5. Verify cloneNode() used
  });
});
```

---

## Priority Matrix

| System | Priority | Complexity | Impact | Tests Needed | Estimated Time |
|--------|----------|------------|--------|--------------|----------------|
| **Book Series Progression** | 🔴 **CRITICAL** | High | Critical - Core gameplay | 8-10 tests | 6-8 hours |
| **Story Progress Triggers** | 🟡 **HIGH** | Medium | High - Narrative flow | 6-8 tests | 4-6 hours |
| **Kethaneum Weaving** | 🟡 **HIGH** | Medium | High - Unique mechanic | 4-5 tests | 3-4 hours |
| **Progress Bitmap** | 🟡 **HIGH** | Medium | High - Data integrity | 4-5 tests | 2-3 hours |
| **Book Discovery** | 🟡 **MEDIUM-HIGH** | Low | High - Player visibility | 4-5 tests | 2-3 hours |
| **Dialogue Story Beats** | 🟢 **MEDIUM** | Medium | Medium - Polish feature | 5-6 tests | 3-4 hours |
| **Character System** | 🟢 **MEDIUM** | Medium | Medium - Content delivery | 4-5 tests | 3-4 hours |
| **Audio Settings** | 🟢 **MEDIUM** | Low | Medium - Player experience | 6-8 tests | 3-4 hours |
| **Genre Exhaustion** | 🟢 **MEDIUM-LOW** | Low | Medium - Edge case | 2-3 tests | 1-2 hours |
| **Audio Context** | 🟢 **LOW** | Low | Low - Browser compat | 2-3 tests | 1-2 hours |

**Total Estimated Time:** 28-40 hours of test development

---

## Implementation Phases

### **Phase 1: Book of Passage Core** (Week 1)
**Priority:** 🔴 CRITICAL
**Goal:** Ensure book progression works correctly

**Tests to Implement:**
1. ✅ Book series progression (3 tests)
2. ✅ Book discovery and completion (4 tests)
3. ✅ Progress bitmap validation (4 tests)
4. ✅ Book state persistence (3 tests)

**Files to Create:**
- `cypress/e2e/book-series-progression.cy.ts`
- `cypress/e2e/book-discovery.cy.ts`
- `cypress/e2e/book-progress-bitmap.cy.ts`
- `cypress/e2e/book-state-persistence.cy.ts`

**Success Criteria:**
- All book progression flows validated
- Data integrity confirmed across saves/loads
- No regression in current book tracking

---

### **Phase 2: Story Integration** (Week 2)
**Priority:** 🟡 HIGH
**Goal:** Validate story system and special mechanics

**Tests to Implement:**
1. ✅ Story progress triggers (5 tests)
2. ✅ Kethaneum weaving pattern (4 tests)
3. ✅ Genre exhaustion cycle (2 tests)

**Files to Create:**
- `cypress/e2e/story-progress-triggers.cy.ts`
- `cypress/e2e/kethaneum-weaving.cy.ts`
- `cypress/e2e/genre-exhaustion.cy.ts`

**Success Criteria:**
- Story milestones fire correctly
- Kethaneum insertion pattern validated
- Genre reset mechanism confirmed

---

### **Phase 3: Dialogue System** (Week 3)
**Priority:** 🟢 MEDIUM
**Goal:** Ensure dialogue content delivery works

**Tests to Implement:**
1. ✅ Story beat filtering (3 tests)
2. ✅ Character loading and availability (5 tests)
3. ✅ Trigger system integration (covered in Phase 2)
4. ✅ Data loading robustness (4 tests)

**Files to Create:**
- `cypress/e2e/dialogue-story-beats.cy.ts`
- `cypress/e2e/dialogue-character-system.cy.ts`
- `cypress/e2e/dialogue-data-loading.cy.ts`

**Success Criteria:**
- Dialogue availability changes with story beats
- Character system robust to errors
- Data loading handles failures gracefully

---

### **Phase 4: Audio System** (Week 4)
**Priority:** 🟢 MEDIUM
**Goal:** Validate audio settings and persistence

**Tests to Implement:**
1. ✅ Settings persistence (4 tests)
2. ✅ Volume/mute hierarchy (5 tests)
3. ✅ Modal UI interactions (6 tests)
4. ✅ Browser compatibility (3 tests)

**Files to Create:**
- `cypress/e2e/audio-settings-persistence.cy.ts`
- `cypress/e2e/audio-volume-mute.cy.ts`
- `cypress/e2e/audio-settings-modal.cy.ts`
- `cypress/e2e/audio-context.cy.ts`

**Success Criteria:**
- Audio settings persist correctly
- Volume calculations accurate
- Modal UI works as expected
- Browser compatibility confirmed

---

## Test Utilities Needed

### 1. Book Progress Helper

**File:** `cypress/support/book-helpers.ts`

```typescript
/**
 * Set up specific book completion state for testing
 */
export function setBookProgress(
  bookTitle: string,
  completedParts: number[],
  totalParts: number
) {
  cy.window().then((win) => {
    const state = (win as any).__GAME_STATE__;
    if (!state) throw new Error('Game state not exposed');

    // Initialize book array
    state.books[bookTitle] = Array(totalParts).fill(false);

    // Mark completed parts
    completedParts.forEach(partIndex => {
      state.books[bookTitle][partIndex] = true;
    });

    // Update bookProgress
    state.bookProgress[bookTitle] = completedParts.length;

    // Add to discovered books
    state.discoveredBooks.add(bookTitle);
  });
}

/**
 * Fast-forward to specific book completion percentage
 */
export function setBookCompletion(
  bookTitle: string,
  percentage: number
) {
  // Calculate parts to complete based on percentage
  // Mock completion state
}
```

### 2. Story Beat Advancer

**File:** `cypress/support/story-helpers.ts`

```typescript
/**
 * Advance story beat to specific point
 */
export function setStoryBeat(beat: StoryBeat) {
  cy.window().then((win) => {
    const state = (win as any).__GAME_STATE__;
    state.storyProgress.currentStoryBeat = beat;

    // Also update DialogueManager if loaded
    const dialogueManager = (win as any).__DIALOGUE_MANAGER__;
    if (dialogueManager) {
      dialogueManager.setStoryBeat(beat);
    }
  });
}

/**
 * Fire specific story trigger manually for testing
 */
export function fireTrigger(trigger: StoryTrigger) {
  // Mock trigger firing
  // Useful for testing UI response to triggers
}
```

### 3. Audio Settings Spy

**File:** `cypress/support/audio-helpers.ts`

```typescript
/**
 * Spy on AudioManager method calls
 */
export function spyOnAudioManager() {
  cy.window().then((win) => {
    const audioManager = (win as any).AudioManager?.getInstance();
    if (!audioManager) throw new Error('AudioManager not initialized');

    // Spy on key methods
    cy.spy(audioManager, 'playMusic').as('playMusic');
    cy.spy(audioManager, 'setVolume').as('setVolume');
    cy.spy(audioManager, 'setMuted').as('setMuted');
  });
}

/**
 * Verify audio settings in localStorage
 */
export function verifyAudioSettings(expected: Partial<AudioSettings>) {
  cy.window().then((win) => {
    const saved = win.localStorage.getItem('kethaneumAudioSettings');
    expect(saved).to.not.be.null;

    const settings = JSON.parse(saved);
    Object.keys(expected).forEach(key => {
      expect(settings[key]).to.equal(expected[key]);
    });
  });
}
```

### 4. Trigger Validator

**File:** `cypress/support/trigger-validator.ts`

```typescript
/**
 * Verify story trigger fires after state change
 */
export function expectTriggerToFire(
  trigger: StoryTrigger,
  stateChange: () => void
) {
  // Capture initial state
  cy.window().then((win) => {
    const before = (win as any).__GAME_STATE__.storyProgress;
    const beforeFired = [...before.firedTriggers];

    // Execute state change
    stateChange();

    // Verify trigger fired
    cy.window().then((win2) => {
      const after = (win2 as any).__GAME_STATE__.storyProgress;
      expect(after.firedTriggers).to.include(trigger);
      expect(after.firedTriggers.length).to.be.greaterThan(beforeFired.length);
    });
  });
}
```

---

## Additional Resources

### Key Files Reference

**Book of Passage System:**
- `/lib/book/bookRegistry.ts` - Book metadata registry
- `/lib/book/progressBitmap.ts` - Compact storage system
- `/lib/game/puzzleSelector.ts` - Book and puzzle selection logic
- `/lib/game/logic.ts` - Book completion detection
- `/lib/story/storyProgressManager.ts` - Story triggers and blurbs
- `/lib/game/state.ts` - Game state management
- `/lib/save/unifiedSaveSystem.ts` - Save/load with format detection

**Dialogue System:**
- `/lib/dialogue/DialogueManager.ts` - Core dialogue manager (797 lines)
- `/lib/dialogue/types.ts` - Type definitions
- `/lib/story/storyProgressManager.ts` - Story blurbs and triggers
- `/hooks/dialogue/useDialogue.ts` - React hook
- `/public/data/dialogue-config.json` - Configuration
- `/public/data/characters/` - Character files

**Audio System:**
- `/lib/audio/audioManager.ts` - Core audio manager (797 lines)
- `/hooks/useAudio.ts` - React hook wrapper
- `/components/AudioProvider.tsx` - App initialization
- `/components/AudioSettingsModal.tsx` - Settings UI
- `/lib/save/saveSystem.ts` - Settings persistence

### Documentation

- `/cypress/README.md` - Current test documentation
- `/docs/AUDIO_SYSTEM.md` - Audio system documentation (868 lines)
- `/public/audio/README.md` - Audio file organization

### Test Configuration

- `/cypress.config.ts` - Cypress configuration
- `/cypress/support/commands.ts` - Custom commands
- `/cypress/support/word-finder.ts` - Word finding utility
- `/cypress/support/e2e.ts` - Global setup

---

## Notes for Handoff

### Current Status
- ✅ Comprehensive review completed
- ✅ Test recommendations documented
- ✅ Priority matrix established
- ❌ No new tests implemented yet (awaiting green light)

### Next Steps
1. **Immediate:** Start with Phase 1 (Book of Passage Core)
2. **Create test utilities** before writing tests (will save time)
3. **Focus on critical path:** Book series progression is highest priority
4. **Skipped tests:** Puzzle Only and Beat the Clock modes still broken - skip for now

### Known Issues to Watch
- `currentBook` preservation (recent fix - needs regression test)
- State clearing race conditions during puzzle loading
- Bitmap sanitization with out-of-range bits
- Story beat advancement (not implemented - tests will reveal this)
- Character group loading (only introduction group loads currently)

### Testing Strategy
- **Mock data** for faster tests (small genres, few puzzles)
- **Expose game state** via `window.__GAME_STATE__` for inspection
- **Use cy.wait()** sparingly - prefer assertions over arbitrary waits
- **Data-testid** attributes already in place - use them!

### Questions for Product Owner
1. Should story beats advance automatically or remain manual?
2. When should character loading groups trigger (currently manual)?
3. What's the expected behavior when Kethaneum exhausted but genre puzzles remain?
4. Should there be UI indication of book series progression?

---

**End of Document**
Last Updated: 2025-11-28
Next AI: Please start with Phase 1, Priority 🔴 tests. Good luck! 🎮
