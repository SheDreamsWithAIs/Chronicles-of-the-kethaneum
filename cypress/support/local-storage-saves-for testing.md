# Test Save Files for Chronicles of the Kethaneum

This file contains pre-configured save states for testing various game scenarios. These saves use the optimized v2 format and include narrative orchestration.

## How to Use

1. Copy the JSON object for the desired test scenario
2. Open browser DevTools Console
3. Run: `localStorage.setItem('kethaneumProgress', JSON.stringify({paste JSON here}))`
4. Refresh the page

## Save Format Reference

### Key Fields
- `v`: Version (2 for optimized format)
- `d`: Discovered books (comma-separated book IDs)
- `p`: Completed parts (book ID -> bitmap)
- `g`: Completed puzzles by genre
- `m`: Game mode (`s`=story, `p`=puzzle-only, `b`=beat-the-clock)
- `n`: Total completed puzzles
- `c`: Current puzzle state
- `s`: Selection state (Kethaneum tracking)
- `sp`: Story progress (blurbs, triggers)
- `dl`: Dialogue completed story events
- `dlv`: Dialogue has visited library
- `no`: Narrative orchestration

### Narrative Orchestration (`no`)
- `kc`: Kethaneum puzzles completed
- `d`: Story event debt
- `sc`: Story events completed count
- `u`: Unlocked story event IDs
- `c`: Completed story event IDs
- `l`: Last unlocked story event ID

### Book IDs
- **Kethaneum**: K001
- **Nature**: N001 (Fruits of the Orchard - 5 parts), N002 (Animals of the Savanna - 3 parts), N003 (Creatures of the Sea - 1 part)
- **Fantasy**: F001 (World of Magic), F002 (Kingdom of Legends), F003 (Mythical Creatures)
- **Science**: S001 (Solar System), S002 (Chemistry Basics)

### Bitmap Encoding
Parts are encoded as decimal numbers where each bit = part completion:
- `3` = binary 11 = parts 0,1 complete (2 parts)
- `7` = binary 111 = parts 0,1,2 complete (3 parts)
- `15` = binary 1111 = parts 0,1,2,3 complete (4 parts)
- `31` = binary 11111 = parts 0,1,2,3,4 complete (5 parts)

---

## Test Scenario 1: Fresh Start - First Event Unlocked

**Use this to test:**
- First story event notification
- First puzzle experience
- Genre selection from library

```json
{
  "v": 2,
  "d": "S001",
  "p": {},
  "g": {},
  "m": "s",
  "n": 0,
  "c": {
    "g": "science",
    "b": "S001",
    "p": 0,
    "i": 0
  },
  "s": {
    "g": "science",
    "k": 0,
    "p": 0,
    "i": 6,
    "r": false,
    "e": false
  },
  "sp": {
    "currentBlurbId": "",
    "unlockedBlurbs": [],
    "currentStoryBeat": "hook",
    "lastUpdated": 0,
    "firedTriggers": []
  },
  "dl": [],
  "dlv": false,
  "no": {
    "kc": 0,
    "d": 1,
    "sc": 0,
    "u": ["first-visit"],
    "c": [],
    "l": "first-visit"
  }
}
```

---

## Test Scenario 2: Debt Threshold - Both Events Unlocked

**Use this to test:**
- Story event debt=2 blocks Kethaneum puzzle
- Both first-visit and test-event-1 unlocked
- Kethaneum gating behavior

**Requirements met:**
- first-visit: 0 Kethaneum + 0 normal ✓
- test-event-1: 1 Kethaneum + 7 normal ✓

**State:**
- Completed: 7 Nature puzzles (N001: 5 parts, N002: 2 parts) + 1 Kethaneum (K001: 1 part)
- Total: 8 puzzles
- Next Kethaneum interval passed, but blocked by debt=2
- Story events: first-visit and test-event-1 both unlocked, neither completed

```json
{
  "v": 2,
  "d": "S001,N001,N002,K001",
  "p": {
    "N001": 31,
    "N002": 3,
    "K001": 1
  },
  "g": {
    "nature": ["N001-0", "N001-1", "N001-2", "N001-3", "N001-4", "N002-0", "N002-1"],
    "Kethaneum": ["K001-0"]
  },
  "m": "s",
  "n": 8,
  "c": {
    "g": "nature",
    "b": "N002",
    "p": 2,
    "i": 1
  },
  "s": {
    "g": "nature",
    "k": 1,
    "p": 7,
    "i": 6,
    "r": true,
    "e": false
  },
  "sp": {
    "currentBlurbId": "",
    "unlockedBlurbs": [],
    "currentStoryBeat": "hook",
    "lastUpdated": 0,
    "firedTriggers": []
  },
  "dl": [],
  "dlv": true,
  "no": {
    "kc": 1,
    "d": 2,
    "sc": 0,
    "u": ["first-visit", "test-event-1"],
    "c": [],
    "l": "test-event-1"
  }
}
```

---

## Test Scenario 3: Story Events Completed - Debt Cleared

**Use this to test:**
- Debt decrement after story event completion (via dialogue)
- Kethaneum no longer blocked
- Story event notification cleared

**Requirements met:**
- first-visit: 0 Kethaneum + 0 normal ✓
- test-event-1: 1 Kethaneum + 7 normal ✓

**State:**
- Completed: 7 Nature puzzles + 1 Kethaneum = 8 total
- Story events: first-visit and test-event-1 both unlocked AND completed via dialogue
- Debt: 0 (2 events unlocked, then both completed through dialogue)
- Kethaneum no longer blocked

```json
{
  "v": 2,
  "d": "S001,N001,N002,K001",
  "p": {
    "N001": 31,
    "N002": 3,
    "K001": 1
  },
  "g": {
    "nature": ["N001-0", "N001-1", "N001-2", "N001-3", "N001-4", "N002-0", "N002-1"],
    "Kethaneum": ["K001-0"]
  },
  "m": "s",
  "n": 8,
  "c": {
    "g": "nature",
    "b": "N002",
    "p": 2,
    "i": 1
  },
  "s": {
    "g": "nature",
    "k": 1,
    "p": 7,
    "i": 6,
    "r": true,
    "e": false
  },
  "sp": {
    "currentBlurbId": "",
    "unlockedBlurbs": [],
    "currentStoryBeat": "hook",
    "lastUpdated": 0,
    "firedTriggers": []
  },
  "dl": ["first-visit", "test-event-1"],
  "dlv": true,
  "no": {
    "kc": 1,
    "d": 0,
    "sc": 2,
    "u": ["first-visit", "test-event-1"],
    "c": ["first-visit", "test-event-1"],
    "l": "test-event-1"
  }
}
```

---

## Test Scenario 4: Many Puzzles Completed - test-event-1 Ready

**Use this to test:**
- first-visit completed (via dialogue)
- test-event-1 ready to unlock (has enough puzzles)
- Debt cleared back to 0

**Requirements met:**
- first-visit: 0 Kethaneum + 0 normal ✓ (completed)
- test-event-1: 1 Kethaneum + 7 normal ✓ (ready to unlock)

**State:**
- Completed: 14 normal + 2 Kethaneum = 16 total puzzles
- Normal: Nature(9) + Science(2) + Fantasy(3) = 14
- Story events: first-visit completed via dialogue
- Debt: 0 (first-visit unlocked then completed)
- test-event-1 not yet unlocked (will unlock on next puzzle completion)

```json
{
  "v": 2,
  "d": "S001,S002,N001,N002,N003,F001,F002,F003,K001",
  "p": {
    "S001": 1,
    "S002": 1,
    "N001": 31,
    "N002": 7,
    "N003": 1,
    "F001": 1,
    "F002": 1,
    "F003": 1,
    "K001": 3
  },
  "g": {
    "science": ["S001-0", "S002-0"],
    "nature": ["N001-0", "N001-1", "N001-2", "N001-3", "N001-4", "N002-0", "N002-1", "N002-2", "N003-0"],
    "fantasy": ["F001-0", "F002-0", "F003-0"],
    "Kethaneum": ["K001-0", "K001-1"]
  },
  "m": "s",
  "n": 16,
  "c": {
    "g": "fantasy",
    "b": "F003",
    "p": 0,
    "i": 2
  },
  "s": {
    "g": "fantasy",
    "k": 2,
    "p": 8,
    "i": 6,
    "r": true,
    "e": false
  },
  "sp": {
    "currentBlurbId": "",
    "unlockedBlurbs": [],
    "currentStoryBeat": "hook",
    "lastUpdated": 0,
    "firedTriggers": []
  },
  "dl": ["first-visit"],
  "dlv": true,
  "no": {
    "kc": 2,
    "d": 0,
    "sc": 1,
    "u": ["first-visit"],
    "c": ["first-visit"],
    "l": "first-visit"
  }
}
```

---

## Test Scenario 5: Nature Genre Exhausted

**Use this to test:**
- Genre completion modal
- All puzzles in nature genre completed
- Genre switching behavior

**State:**
- Completed: All 9 Nature puzzles (N001: 5 parts, N002: 3 parts, N003: 1 part)
- Genre completion modal should appear
- Other genres still available

```json
{
  "v": 2,
  "d": "S001,N001,N002,N003",
  "p": {
    "N001": 31,
    "N002": 7,
    "N003": 1
  },
  "g": {
    "nature": ["N001-0", "N001-1", "N001-2", "N001-3", "N001-4", "N002-0", "N002-1", "N002-2", "N003-0"]
  },
  "m": "s",
  "n": 9,
  "c": {
    "g": "nature",
    "b": "N003",
    "p": 0,
    "i": 2
  },
  "s": {
    "g": "nature",
    "k": 0,
    "p": 9,
    "i": 6,
    "r": false,
    "e": true
  },
  "sp": {
    "currentBlurbId": "",
    "unlockedBlurbs": [],
    "currentStoryBeat": "hook",
    "lastUpdated": 0,
    "firedTriggers": []
  },
  "dl": [],
  "dlv": true,
  "no": {
    "kc": 0,
    "d": 1,
    "sc": 0,
    "u": ["first-visit"],
    "c": [],
    "l": "first-visit"
  }
}
```

---

## Test Scenario 6: Puzzle-Only Mode

**Use this to test:**
- Puzzle-only game mode
- No story event tracking
- Random puzzle selection

**State:**
- Game mode: Puzzle-only
- Completed: 15 puzzles
- No narrative orchestration (not used in puzzle-only)

```json
{
  "v": 2,
  "d": "N001,N002,F001,F002,S001",
  "p": {
    "N001": 15,
    "N002": 3,
    "F001": 1,
    "F002": 1,
    "S001": 1
  },
  "g": {
    "nature": ["N001-0", "N001-1", "N001-2", "N001-3", "N002-0", "N002-1", "N002-2"],
    "fantasy": ["F001-0", "F002-0"],
    "science": ["S001-0"]
  },
  "m": "p",
  "n": 15,
  "c": {
    "g": "fantasy",
    "b": "F002",
    "p": 0,
    "i": 1
  },
  "s": {
    "g": "fantasy",
    "k": 0,
    "p": 0,
    "i": 0,
    "r": false,
    "e": false
  }
}
```

---

## Notes

- **Audio settings (`a`) are optional** and not included in these test saves
- **Story progress (`sp`) is minimal** as story blurbs are separate from narrative orchestration
- **Dialogue state (`dl`, `dlv`)** tracks which story events have been completed via library conversations
- **Narrative orchestration (`no`)** is the new unified system that tracks story event unlocking and debt
- When creating custom saves, make sure:
  - Total puzzles (`n`) matches the count in `g`
  - Discovered books (`d`) includes all books with completed parts in `p`
  - Book part counts in `p` bitmap match the registry (N001 has 5 parts, etc.)
  - Debt (`no.d`) is calculated correctly: +1 per unlocked event, -1 per Kethaneum completion
