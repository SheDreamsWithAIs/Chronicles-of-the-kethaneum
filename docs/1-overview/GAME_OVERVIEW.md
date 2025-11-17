# Chronicles of the Kethaneum - Game Overview

## Introduction

Chronicles of the Kethaneum is a **narrative word search puzzle game** that weaves storytelling with classic puzzle gameplay. Players uncover an epic tale through solving word puzzles, experiencing a unique blend of casual puzzle mechanics and immersive narrative progression.

**Quick Stats:**
- **Genre:** Word Search Puzzle Game with Narrative
- **Platform:** Web-based (Next.js)
- **Game Modes:** 3 (Story, Puzzle-Only, Beat-the-Clock)
- **Puzzle Grid:** 8×8 to 12×12 (based on difficulty)
- **Estimated Playtime:** 15+ hours for complete story

---

## Game Modes

Chronicles of the Kethaneum offers three distinct game modes, each providing a different experience:

### 1. Story Mode

**The primary narrative experience** where players progress through the Chronicles of the Kethaneum story.

**How it works:**
- Players select a puzzle genre (Nature, Test, etc.) from the Library
- After solving several puzzles from their chosen genre (2-5 random interval), the game automatically presents a Kethaneum narrative puzzle
- This "weaving" system creates a natural storytelling rhythm while letting players enjoy their preferred puzzle types
- Puzzles are organized into Books and Story Parts that unlock sequentially
- Timer is decorative only - no time pressure
- Progress is automatically saved

**Story Structure:**
- Multiple Books, each telling a complete story arc
- Each Book divided into Story Parts (0-4):
  - Part 0: The Hook/Introduction
  - Part 1: Rising Action/Complication
  - Part 2: Midpoint Twist
  - Part 3: Climactic Moment
  - Part 4: Resolution/Epilogue
- Story excerpts appear before each narrative puzzle
- Characters provide dialogue between puzzles

**Progression:**
- Complete puzzles to advance the story
- Discover new books as you progress
- Track completion in the Library
- Genre completion notifications when all puzzles in a genre are solved

### 2. Puzzle-Only Mode

**Pure puzzle gameplay** without story constraints.

**How it works:**
- Random puzzle selection from any available genre
- Real countdown timer (2.5-4 minutes based on difficulty)
- Lose if time expires before finding all words
- No story progression tracking
- Quick, casual gameplay sessions

**Perfect for:**
- Quick gaming sessions
- Practicing puzzle-solving skills
- Trying puzzles without story commitment
- Challenge seekers who want time pressure

### 3. Beat-the-Clock Mode

**Time-based endurance challenge** with statistics tracking.

**How it works:**
- Fixed 5-minute run duration
- Solve as many puzzles as possible within the time limit
- Each puzzle has its own timer within the overall run
- Detailed statistics at the end:
  - Total puzzles completed
  - Total words found
  - Average time per puzzle
  - Individual puzzle performance
- High-intensity gameplay

**Perfect for:**
- Competitive players
- Speed-running challenges
- Testing puzzle-solving efficiency
- Tracking personal improvement

---

## Core Mechanics

### Word Search Puzzle Gameplay

**The Grid:**
- Square grid (size varies by difficulty: 8×8, 10×10, or 12×12)
- Letters arranged in rows and columns
- Words hidden in 8 possible directions:
  - Horizontal (left-to-right, right-to-left)
  - Vertical (top-to-bottom, bottom-to-top)
  - Diagonal (4 directions)

**Finding Words:**
1. Click/tap a cell to start selecting
2. Drag to adjacent cells to form a word
3. Release to check if the selection matches a word
4. Correctly found words are marked and removed from the word list
5. Find all words to complete the puzzle

**Word List:**
- 4-10 words per puzzle (based on difficulty)
- Words appear at the bottom of the screen
- Found words are visually marked
- Word count shows progress (e.g., "3/8 words found")

**Difficulty Levels:**

| Level | Grid Size | Time Limit | Word Count | Word Length |
|-------|-----------|------------|------------|-------------|
| Easy | 8×8 | 4 minutes | 6 words | 3-8 letters |
| Medium | 10×10 | 3 minutes | 8 words | 3-10 letters |
| Hard | 12×12 | 2.5 minutes | 10 words | 3-12 letters |

**Note:** Story Mode timer is decorative only; Puzzle-Only and Beat-the-Clock modes enforce time limits.

---

## Special Features

### Kethaneum Weaving System

The signature feature that makes this game unique.

**What is Kethaneum Weaving?**
- An intelligent puzzle selection system that alternates between your chosen genre and narrative puzzles
- After solving 2-5 puzzles from your selected genre (random interval), the game presents a Kethaneum story puzzle
- Creates organic narrative pacing without forcing continuous story consumption
- Lets players enjoy their preferred puzzle types while gradually revealing the overarching narrative

**How it feels in practice:**
1. You select "Nature" genre from the Library
2. You solve 3 nature-themed puzzles
3. Suddenly, a Kethaneum narrative puzzle appears with story text
4. After completing it, you return to nature puzzles
5. The cycle continues, revealing the story bit by bit

**Smart tracking:**
- Prevents puzzle repetition within a genre
- Maintains story sequence order
- Adapts to genre completion (restarts when all puzzles solved)
- Reveals the Kethaneum genre in the Library after first encounter

### Seeded Random Generation

**Reproducible puzzles:**
- Each puzzle generates the same grid layout every time
- Uses seeded random number generation
- Ensures consistent player experience
- Allows for puzzle design quality control

**Two-Phase Word Placement:**
1. **Phase 1 - Random Attempts:** Tries to place words randomly (100 attempts per word)
2. **Phase 2 - Systematic Placement:** If random fails, scans grid systematically to find a valid placement
3. **Result:** All words always find a home, creating solvable puzzles

### Character Dialogue System

**Dynamic character interactions:**
- Characters appear between puzzles with contextual dialogue
- Dialogue changes based on story progression
- Story beat awareness (characters know where you are in the narrative)
- Character retirement (some characters fade out as story progresses)
- Weighted random selection (avoids repetition)

**Character Loading Groups:**
- Introduction characters (early game)
- Mid-story characters
- Late-story characters
- Characters load based on story progression to avoid spoilers

### Audio System

**Four independent audio channels:**
1. **Music** - Background musical tracks
2. **Ambient** - Environmental soundscapes
3. **SFX** - Sound effects for interactions
4. **Voice** - Character voice lines (if implemented)

**Audio Features:**
- Individual volume controls for each channel
- Master volume control
- Mute toggles for each channel
- Smooth fade-in/fade-out transitions
- Playlist support with multiple playback modes:
  - Sequential
  - Shuffle
  - Repeat One
  - Repeat All
- Context-aware playlists (different music for different game states)

**Note:** Audio files are user-added in the `/public/audio` directory. See [Audio System Documentation](../3-systems/AUDIO_SYSTEM.md) for details.

---

## User Interface

### Main Screens

**Title Screen:**
- New Game / Continue Game options
- Game Mode selection
- Settings access
- Navigation to Backstory and Library

**Puzzle Screen:**
- Central puzzle grid (main gameplay area)
- Word list at bottom
- Timer display (decorative or functional based on mode)
- Navigation menu
- Audio settings toggle
- Pause/Resume functionality

**Library Screen:**
- Book collection browser
- Progress tracking by book and genre
- Genre selection for Story Mode
- Completion statistics
- Discovered books counter

**Backstory Screen:**
- Story introduction
- Narrative context
- Character introductions
- World-building content

**Book of Passage Screen:**
- Current book progress
- Story part visualization
- Navigation between story sections

### UI Components

**Navigation Bar:**
- Appears across all screens
- Links to: Puzzle, Library, Backstory, Book of Passage
- Always accessible (except during active puzzles)

**Modals:**
- Game Mode Selection - Choose how to play
- Genre Selection - Pick your puzzle genre
- Game Stats - End-game statistics display
- Genre Completion - Notification when genre exhausted
- Audio Settings - Full audio control panel

**Cosmic Background:**
- Animated background across all screens
- Thematic visual consistency
- Subtle animations for immersion

---

## Story Progression System

### How Story Advances

**In Story Mode:**
1. Select a genre from the Library (e.g., "Nature")
2. Solve puzzles from your chosen genre
3. After a random interval (2-5 puzzles), encounter a Kethaneum narrative puzzle
4. Read the story excerpt
5. Solve the puzzle to advance the story
6. Return to your selected genre
7. Repeat until story is complete

**Story Organization:**
- **Genres** - Thematic puzzle collections (Kethaneum, Nature, etc.)
- **Books** - Story arcs within the Kethaneum genre
- **Story Parts** - Sequential chapters within each book (0-4)
- **Puzzles** - Individual word search puzzles tied to story parts

### Progress Tracking

**What's Tracked:**
- **Discovered Books** - Total unique books encountered
- **Completed Books** - Books with all parts finished
- **Current Book** - Active story arc
- **Current Story Part** - Where you are in the current book
- **Genre Completion** - Puzzles completed per genre
- **Completed Puzzles** - Total puzzle count
- **Session Statistics** - Performance metrics

**Persistence:**
- Game state automatically saves after each puzzle
- Saves to browser's localStorage
- Restore on app reload
- Cross-session progress tracking

**Book Completion:**
- Each book has multiple story parts (typically 4-5)
- Must complete all parts to finish a book
- Parts must be completed sequentially
- Book tracks progress with completion array

**Genre Completion:**
- When all puzzles in a genre are completed, player is notified
- Option to restart the genre (replay puzzles)
- Option to select a different genre
- Completion tracked per genre to avoid repetition

---

## Configuration & Settings

### Difficulty Settings

**Changeable settings:**
- Grid size (8×8 to 12×12)
- Time limit (2.5 to 4 minutes)
- Number of words (6 to 10)
- Word length constraints (min/max)

**Preset Difficulties:**
- **Easy** - Larger text, smaller grid, more time
- **Medium** - Balanced challenge
- **Hard** - Smaller text, larger grid, less time

### Feature Flags

**Toggleable features:**
- Sound effects (on/off)
- Music (on/off)
- Haptic feedback (on/off)
- Animations (on/off)
- Timer display (decorative vs. functional)

### Audio Settings

**Adjustable parameters:**
- Master volume (0-100%)
- Music volume (0-100%)
- Ambient volume (0-100%)
- SFX volume (0-100%)
- Voice volume (0-100%)
- Individual mute toggles

**Persistent:**
- Audio settings save automatically
- Restore on next session
- Per-channel preferences

---

## Game Flow Examples

### Example 1: Story Mode Session

1. Player starts game, sees Title Screen
2. Clicks "Continue Game" (has existing save)
3. Navigates to Library
4. Selects "Nature" genre
5. Game loads first nature puzzle
6. Player solves puzzle (finds all words)
7. Character dialogue appears with encouragement
8. Next nature puzzle loads
9. Player solves second puzzle
10. Third puzzle loads (still nature)
11. Player solves third puzzle
12. **Kethaneum narrative puzzle appears** with story excerpt
13. Player reads story, solves puzzle
14. Story advances to next part
15. Game returns to nature puzzles
16. Cycle continues...

### Example 2: Puzzle-Only Quick Play

1. Player opens game
2. Selects "Puzzle-Only Mode"
3. Random puzzle loads immediately
4. 3-minute countdown timer starts
5. Player finds 6 out of 8 words
6. Timer expires - Game Over
7. Stats modal shows performance
8. Player clicks "Play Again"
9. New random puzzle loads
10. Timer resets, new challenge begins

### Example 3: Beat-the-Clock Run

1. Player selects "Beat-the-Clock Mode"
2. 5-minute run timer starts
3. First puzzle loads with its own timer
4. Player solves puzzle in 45 seconds
5. Stats recorded, new puzzle loads immediately
6. Player solves second puzzle in 1 minute
7. Continues solving puzzles rapidly
8. 5-minute timer expires
9. Final statistics modal shows:
   - Puzzles completed: 7
   - Total words found: 52
   - Average time per puzzle: 42 seconds
   - Individual puzzle breakdown
10. Player reviews performance
11. Option to try again for better score

---

## Technical Requirements

**Browser Support:**
- Modern web browsers (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- LocalStorage enabled (for save system)
- Responsive design (desktop and mobile)

**Performance:**
- Lightweight (~6,000 lines of code)
- No heavy external dependencies
- Fast load times
- Smooth animations
- Efficient puzzle generation

**Accessibility:**
- Keyboard navigation support
- Clear visual feedback
- Adjustable difficulty
- Pause functionality
- Colorblind-friendly design (future enhancement)

---

## Tips for Players

**Finding Words Faster:**
- Look for unusual letters first (Q, Z, X, J, K)
- Scan for distinctive letter patterns (TH, CH, QU)
- Check word endings and beginnings
- Try diagonal directions (often overlooked)
- Use process of elimination with remaining words

**Story Mode Strategy:**
- Choose a genre you enjoy - you'll see those puzzles most often
- Read story excerpts carefully - they enhance the experience
- Check the Library to track your progress
- Don't worry about the timer - it's decorative in Story Mode

**Beat-the-Clock Tips:**
- Prioritize short words first (easier to find quickly)
- Don't dwell on hard words - move to next puzzle if stuck
- Practice in Puzzle-Only Mode first
- Learn common word patterns
- Stay calm - rushing causes mistakes

**General Tips:**
- Adjust difficulty to match your skill level
- Use audio settings to create your preferred atmosphere
- Take breaks - fresh eyes find words faster
- Explore the Library to see all available content
- Read character dialogue - it adds personality to the experience

---

## Related Documentation

For more technical details, see:
- [Architecture Summary](ARCHITECTURE_SUMMARY.md) - Technical overview
- [Codebase Architecture](../2-architecture/CODEBASE_ARCHITECTURE.md) - Detailed code structure
- [Puzzle System](../3-systems/PUZZLE_SYSTEM.md) - How puzzles work technically
- [Audio System](../3-systems/AUDIO_SYSTEM.md) - Audio implementation details
- [Adding Puzzles Guide](../5-guides/ADDING_PUZZLES.md) - Create your own puzzles

---

## Frequently Asked Questions

**Q: How long does it take to complete the story?**
A: The full story contains 15+ hours of content, but it depends on your puzzle-solving speed and how often you replay genres.

**Q: Can I skip story puzzles and just play my chosen genre?**
A: The Kethaneum weaving is part of the Story Mode experience. For pure genre play, use Puzzle-Only Mode.

**Q: What happens when I complete all puzzles in a genre?**
A: You'll receive a notification and can choose to restart the genre (replay puzzles) or select a different genre.

**Q: Does my progress save automatically?**
A: Yes, after each completed puzzle. Progress is stored in your browser's localStorage.

**Q: Can I play offline?**
A: Once loaded, the game works offline. However, audio files require initial download.

**Q: How is puzzle difficulty determined?**
A: Grid size, word count, word length, and time limit all contribute. Difficulty presets (Easy/Medium/Hard) adjust all parameters.

**Q: Are puzzles randomly generated or hand-crafted?**
A: Word lists are hand-crafted for story coherence, but grid layouts are procedurally generated using seeded randomization.

**Q: Can I create my own puzzles?**
A: Yes! See the [Adding Puzzles Guide](../5-guides/ADDING_PUZZLES.md) for instructions.

---

*Chronicles of the Kethaneum combines the satisfying simplicity of word search puzzles with rich narrative storytelling, creating a unique gaming experience that respects both casual puzzle fans and story enthusiasts.*
