# Adding Puzzles - Practical Guide

## Introduction

This guide provides **step-by-step instructions** for creating and adding puzzles to Chronicles of the Kethaneum. Whether you're adding story content, expanding genres, or creating test puzzles, this guide covers everything you need to know.

**Who this guide is for:**
- Content creators adding new story arcs
- Developers testing new features
- Contributors expanding game content
- Anyone wanting to customize the game

**What you'll learn:**
- JSON puzzle format specification
- Where to add puzzle files
- How to update the genre manifest
- Testing your puzzles
- Best practices and troubleshooting

---

## Quick Start

**TL;DR: Add a puzzle in 5 steps:**

1. Create JSON file in `public/data/` (e.g., `myPuzzles.json`)
2. Add puzzles using the format: `{ title, book, genre, words, storyPart, storyExcerpt }`
3. Add file path to `public/data/genreManifest.json`
4. Test in browser
5. Commit changes

**Time required:** 10-30 minutes depending on puzzle complexity

---

## Puzzle JSON Format Specification

### Basic Structure

Puzzles are defined in JSON arrays with the following structure:

```json
[
  {
    "title": "Puzzle Title",
    "book": "Book Name",
    "genre": "Genre Name",
    "words": ["word1", "word2", "word3", "word4", "word5"],
    "storyPart": 0,
    "storyExcerpt": "Optional story text that appears before the puzzle..."
  }
]
```

### Field Reference

#### Required Fields

**`title`** (string)
- **Purpose:** Unique identifier for the puzzle
- **Format:** Free text, can include special characters
- **Requirements:** Must be unique across all puzzles
- **Example:** `"Luminos: The Price of 'Perfect Vision' - Part 1 The Foundation Day"`
- **Best Practice:** Include book name and part for narrative puzzles

**`book`** (string)
- **Purpose:** Groups puzzles into story arcs or collections
- **Format:** Free text
- **Requirements:** Must be consistent across related puzzles
- **Example:** `"Luminos: The Price of 'Perfect Vision'"`
- **Best Practice:** Use descriptive, memorable names

**`words`** (array of strings)
- **Purpose:** Words the player must find in the puzzle
- **Format:** Array of lowercase or uppercase strings
- **Requirements:**
  - Must have at least 1 word
  - Recommended: 6-10 words based on difficulty
  - Words will be converted to uppercase in the game
- **Example:** `["principles", "changed", "taking", "credit", "solidarity", "shifting"]`
- **Best Practice:** Choose thematically related words

#### Optional Fields

**`genre`** (string)
- **Purpose:** Categorizes puzzles by theme or type
- **Default:** If not specified, derived from filename
- **Format:** Free text
- **Example:** `"Kethaneum"`, `"Nature"`, `"History"`
- **Best Practice:** Use consistent genre names across puzzles

**`storyPart`** (number)
- **Purpose:** Defines sequential position in a book's narrative
- **Default:** 0 if not specified
- **Format:** Integer (0-4 typically)
- **Values:**
  - 0 = The Hook/Introduction
  - 1 = Rising Action/Complication
  - 2 = Midpoint Twist
  - 3 = Climactic Moment
  - 4 = Resolution/Epilogue
- **Example:** `2` (Midpoint Twist)
- **Best Practice:** Use sequential numbering for story progression

**`storyExcerpt`** (string)
- **Purpose:** Narrative text shown before puzzle
- **Default:** Not displayed if omitted
- **Format:** Free text (can include newlines with `\n`)
- **Recommended Length:** 100-300 words
- **Example:** `"The Kethaneum's central chamber domed ceiling reflected..."`
- **Best Practice:** End with a cliffhanger or hook to engage players

### Complete Example

```json
[
  {
    "title": "The Archivist's First Discovery - Part 1",
    "book": "The Archivist's First Discovery",
    "genre": "Kethaneum",
    "words": ["archive", "ancient", "scroll", "mystery", "hidden", "knowledge", "search"],
    "storyPart": 0,
    "storyExcerpt": "You step into the vast archives for the first time, the scent of old parchment filling your nostrils. Somewhere in these endless shelves lies the truth about the Kethaneum's founding. But where to begin?"
  },
  {
    "title": "The Archivist's First Discovery - Part 2",
    "book": "The Archivist's First Discovery",
    "genre": "Kethaneum",
    "words": ["betrayal", "secret", "founder", "truth", "revelation", "discover"],
    "storyPart": 1,
    "storyExcerpt": "The scroll you found mentions a 'hidden founder' - someone erased from official records. The plot thickens as you realize the Kethaneum's history isn't what you were taught."
  }
]
```

---

## Where to Add Puzzle Files

### Directory Structure

All puzzle files are stored in `public/data/`:

```
public/data/
├── genreManifest.json          # Master list of puzzle files
├── kethaneumPuzzles.json       # Narrative puzzles (Kethaneum genre)
├── naturePuzzles.json          # Nature-themed puzzles
├── testPuzzles.json            # Test puzzles
├── beatTheClockPuzzles.json    # Beat-the-Clock mode puzzles
└── [yourPuzzles].json          # Your new puzzle file
```

### Creating a New Puzzle File

**Step 1: Choose a filename**
- Use descriptive names: `[genre]Puzzles.json`
- Examples:
  - `historyPuzzles.json`
  - `sciencePuzzles.json`
  - `mythologyPuzzles.json`

**Step 2: Create the file**
```bash
# Navigate to data directory
cd public/data/

# Create new file
touch historyPuzzles.json

# Open in editor
code historyPuzzles.json
```

**Step 3: Add puzzle data**
```json
[
  {
    "title": "Ancient Civilizations",
    "book": "History Collection",
    "genre": "History",
    "words": ["egypt", "rome", "greece", "babylon", "persia"],
    "storyPart": 0
  }
]
```

**Step 4: Validate JSON**
- Use online JSON validator: https://jsonlint.com/
- Or use VS Code's built-in JSON validation
- Ensure no syntax errors (missing commas, brackets, quotes)

### Adding to Existing Files

**To add puzzles to an existing file:**

1. **Open the file:**
```bash
# Example: adding to naturePuzzles.json
code public/data/naturePuzzles.json
```

2. **Add a comma after the last puzzle:**
```json
[
  {
    "title": "Existing Puzzle",
    // ... fields
  },  // ← Add comma here
  {
    "title": "Your New Puzzle",
    // ... your fields
  }
]
```

3. **Save and validate:**
- Check JSON syntax
- Ensure unique titles
- Verify genre matches

---

## Updating the Genre Manifest

### What is the Genre Manifest?

The **genre manifest** (`public/data/genreManifest.json`) is a master list that tells the game which puzzle files to load.

**Current structure:**
```json
{
  "genreFiles": [
    "/data/kethaneumPuzzles.json",
    "/data/naturePuzzles.json",
    "/data/testPuzzles.json"
  ]
}
```

### Adding Your Puzzle File

**Step 1: Open the manifest**
```bash
code public/data/genreManifest.json
```

**Step 2: Add your file path**
```json
{
  "genreFiles": [
    "/data/kethaneumPuzzles.json",
    "/data/naturePuzzles.json",
    "/data/testPuzzles.json",
    "/data/historyPuzzles.json"  // ← Your new file
  ]
}
```

**Important:**
- Use forward slashes `/`
- Start path with `/data/`
- Include `.json` extension
- Add comma after previous entry (except last one)

**Step 3: Save the file**

### Manifest Not Required (Alternative)

If you're **adding to an existing file** (like `naturePuzzles.json`), you **don't need to update the manifest** because the file is already listed.

---

## Testing Your Puzzles

### Testing Checklist

Before committing your puzzles, verify:

- [ ] JSON syntax is valid
- [ ] All required fields present
- [ ] Titles are unique
- [ ] Words array has 4+ words
- [ ] Genre manifest updated (if new file)
- [ ] Puzzle appears in game
- [ ] All words are findable
- [ ] Story text displays correctly (if present)

### Manual Testing Steps

#### 1. Start the Development Server

```bash
npm run dev
```

#### 2. Navigate to the Game

- Open browser to `http://localhost:3000`
- Click "New Game" or "Continue Game"
- Select "Story Mode"

#### 3. Select Your Genre

- Navigate to Library
- Click on your genre (if new) or existing genre
- Genre should appear in the list

#### 4. Play the Puzzle

- Start playing puzzles in your genre
- After 2-5 puzzles, your puzzle should appear (if using Kethaneum weaving)
- Or select "Puzzle-Only Mode" to randomly test any puzzle

#### 5. Verify Puzzle Works

- Check that all words are findable
- Verify timer works (if in Puzzle-Only/Beat-the-Clock mode)
- Check that story excerpt displays (if present)
- Ensure completion triggers next puzzle

### Testing with Browser Console

**Open browser console (F12) and check for:**

**Puzzle loaded successfully:**
```
[PuzzleLoader] Loaded 15 puzzles from /data/historyPuzzles.json
```

**Genre recognized:**
```
[PuzzleSelector] Selected genre: History
```

**No errors:**
- No red error messages
- No warnings about invalid puzzles

### Automated Testing (Advanced)

**Create a test script:**

```typescript
// scripts/testPuzzles.ts
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'public/data');

// Read all puzzle files
const manifest = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'genreManifest.json'), 'utf-8')
);

manifest.genreFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), 'public', filePath);
  const puzzles = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

  puzzles.forEach(puzzle => {
    // Validate required fields
    if (!puzzle.title) {
      console.error(`Missing title in ${filePath}`);
    }
    if (!puzzle.book) {
      console.error(`Missing book in ${filePath}: ${puzzle.title}`);
    }
    if (!puzzle.words || puzzle.words.length === 0) {
      console.error(`Missing words in ${filePath}: ${puzzle.title}`);
    }

    // Check for duplicates
    const uniqueWords = new Set(puzzle.words);
    if (uniqueWords.size !== puzzle.words.length) {
      console.warn(`Duplicate words in ${filePath}: ${puzzle.title}`);
    }
  });

  console.log(`✓ ${filePath}: ${puzzles.length} puzzles validated`);
});
```

**Run the test:**
```bash
npx ts-node scripts/testPuzzles.ts
```

---

## Best Practices

### Word Selection

**Choose thematically related words:**
```json
// Good: Related to nature
"words": ["tree", "forest", "leaf", "branch", "root", "bark"]

// Bad: Random unrelated words
"words": ["car", "dance", "purple", "math", "ocean", "computer"]
```

**Vary word lengths:**
```json
// Good: Mix of short and long words
"words": ["cat", "elephant", "dog", "rhinoceros", "bird"]

// Bad: All same length
"words": ["tree", "leaf", "bark", "root"]
```

**Avoid overly difficult words:**
```json
// Good: Common words players will know
"words": ["science", "discover", "experiment", "research"]

// Bad: Obscure or technical jargon
"words": ["phlebotomy", "eukaryotic", "phenotype", "mitochondria"]
```

### Difficulty Balancing

**Easy puzzles:**
- 4-6 words
- Shorter words (3-6 letters)
- Common vocabulary
- Clear thematic connection

**Medium puzzles:**
- 6-8 words
- Mixed lengths (4-8 letters)
- Moderate vocabulary
- Some variety in themes

**Hard puzzles:**
- 8-10 words
- Longer words (6-12 letters)
- Advanced vocabulary
- Less obvious thematic connections

### Story Writing

**Story excerpt best practices:**

**1. Hook the reader:**
```
❌ Bad: "You are in a room. You see some books."
✅ Good: "The ancient tome pulses with an otherworldly light, its pages whispering secrets that were meant to stay hidden..."
```

**2. Build on previous parts:**
```json
{
  "storyPart": 0,
  "storyExcerpt": "You discover a mysterious letter..."
},
{
  "storyPart": 1,
  "storyExcerpt": "The letter's sender reveals shocking information about your family..."
}
```

**3. Match words to story:**
```json
{
  "storyExcerpt": "The ancient library holds countless magical artifacts...",
  "words": ["magic", "artifact", "ancient", "library", "spell", "enchant"]
}
```

**4. Use reasonable length:**
- Too short (< 50 words): Feels incomplete
- Too long (> 400 words): Players lose interest
- Sweet spot: 100-250 words

### Naming Conventions

**Puzzle titles:**
```
Format: [Book Name] - Part [N] [Optional Subtitle]

Good examples:
✅ "The Lost Archive - Part 1 Discovery"
✅ "Luminos: The Price of 'Perfect Vision' - Part 2"
✅ "Nature's Wonders: Forests"

Bad examples:
❌ "Puzzle 1"  (Too generic)
❌ "asdfasdf"  (Not descriptive)
❌ "Part 2"    (Missing book name)
```

**Book names:**
```
Good examples:
✅ "The Lost Archive"
✅ "Chronicles of Luminos"
✅ "Nature's Wonders Collection"

Bad examples:
❌ "Book 1"     (Too generic)
❌ "Untitled"   (Not descriptive)
❌ "Test Book"  (Not final content)
```

**Genre names:**
```
Good examples:
✅ "Kethaneum"
✅ "Nature"
✅ "History"
✅ "Science"

Bad examples:
❌ "Genre1"           (Not descriptive)
❌ "Random Puzzles"   (Too vague)
❌ "Misc"             (Unclear purpose)
```

---

## Examples for Each Game Mode

### Story Mode Puzzle

**Characteristics:**
- Part of narrative sequence
- Has story excerpt
- Sequential story parts
- Thematically connected to story

**Example:**
```json
{
  "title": "The Hidden Founder - Part 1 The Discovery",
  "book": "The Hidden Founder",
  "genre": "Kethaneum",
  "words": ["hidden", "founder", "secret", "archive", "truth", "revealed"],
  "storyPart": 0,
  "storyExcerpt": "While cataloging old manuscripts, you stumble upon a reference to a 'fifth founder' of the Kethaneum - someone whose name has been systematically erased from all official records. This discovery could change everything you thought you knew about the Kethaneum's origins."
}
```

### Puzzle-Only Mode Puzzle

**Characteristics:**
- Can be standalone
- No story excerpt needed
- Just focus on word themes
- Any genre

**Example:**
```json
{
  "title": "Ocean Life",
  "book": "Marine Biology Collection",
  "genre": "Nature",
  "words": ["dolphin", "coral", "whale", "shark", "octopus", "kelp", "tide", "current"]
}
```

### Beat-the-Clock Mode Puzzle

**Characteristics:**
- Optimized for quick solving
- 6-8 words (not too many)
- Moderate difficulty
- Stored in special file

**Example:**
```json
{
  "title": "Quick Challenge: Space",
  "book": "Beat the Clock Collection",
  "genre": "Beat-the-Clock",
  "words": ["planet", "star", "galaxy", "orbit", "comet", "moon"]
}
```

**Note:** Beat-the-Clock puzzles go in `beatTheClockPuzzles.json`

---

## Common Mistakes and Troubleshooting

### Mistake 1: Invalid JSON Syntax

**Symptom:** Puzzle doesn't load, console shows JSON parse error

**Common issues:**
```json
// Missing comma
{
  "title": "Test"
  "book": "Test Book"  // ❌ Missing comma after "Test"
}

// Extra comma
{
  "title": "Test",
  "book": "Test Book",  // ❌ Trailing comma before }
}

// Unescaped quotes
{
  "storyExcerpt": "He said "hello" to me"  // ❌ Use \" for quotes in strings
}

// Wrong quotes
{
  'title': 'Test'  // ❌ Use double quotes, not single quotes
}
```

**Solution:** Use JSON validator (jsonlint.com) or VS Code

### Mistake 2: Duplicate Titles

**Symptom:** Only one puzzle with that title appears

**Cause:**
```json
[
  {
    "title": "Test Puzzle",  // ❌ Duplicate title
    "book": "Book 1",
    "words": ["a", "b", "c"]
  },
  {
    "title": "Test Puzzle",  // ❌ Same title as above
    "book": "Book 2",
    "words": ["d", "e", "f"]
  }
]
```

**Solution:** Make titles unique:
```json
[
  {
    "title": "Test Puzzle - Book 1",  // ✅ Unique
    "book": "Book 1",
    "words": ["a", "b", "c"]
  },
  {
    "title": "Test Puzzle - Book 2",  // ✅ Unique
    "book": "Book 2",
    "words": ["d", "e", "f"]
  }
]
```

### Mistake 3: Missing Genre in Manifest

**Symptom:** Puzzle file exists but doesn't load in game

**Cause:** File not listed in `genreManifest.json`

**Solution:**
```json
{
  "genreFiles": [
    "/data/kethaneumPuzzles.json",
    "/data/naturePuzzles.json",
    "/data/myNewPuzzles.json"  // ✅ Add your file here
  ]
}
```

### Mistake 4: Words Too Long

**Symptom:** Words don't fit in grid, error during generation

**Cause:**
```json
{
  "words": ["supercalifragilisticexpialidocious"]  // ❌ Too long for 10x10 grid
}
```

**Solution:** Default grid is 10×10, so max word length is 10 letters

**Check config:**
```typescript
// lib/core/config.ts
maxWordLength: 12  // Maximum allowed
```

**Better practice:**
```json
{
  "words": ["wonderful", "magic", "special"]  // ✅ Reasonable lengths
}
```

### Mistake 5: Empty or Missing Words Array

**Symptom:** Error message "No valid words provided"

**Cause:**
```json
{
  "title": "Test",
  "book": "Test",
  "words": []  // ❌ Empty array
}
```

or

```json
{
  "title": "Test",
  "book": "Test"
  // ❌ Missing words field entirely
}
```

**Solution:**
```json
{
  "title": "Test",
  "book": "Test",
  "words": ["at", "least", "one", "word"]  // ✅ Minimum 1 word
}
```

### Mistake 6: Incorrect File Path

**Symptom:** Console shows "Failed to load /data/yourFile.json"

**Common errors:**
```json
{
  "genreFiles": [
    "data/myPuzzles.json",        // ❌ Missing leading /
    "/data\myPuzzles.json",       // ❌ Wrong slash direction
    "/data/myPuzzles",            // ❌ Missing .json extension
    "/public/data/myPuzzles.json" // ❌ Don't include /public
  ]
}
```

**Correct format:**
```json
{
  "genreFiles": [
    "/data/myPuzzles.json"  // ✅ Correct
  ]
}
```

---

## Advanced: Creating a Complete Story Arc

### Planning a Story Arc

**Step 1: Outline your story**

```
Book: "The Betrayal of Luminos"

Part 0 (Hook): Discovery of Luminos's first transgression
Part 1 (Rising Action): Evidence mounts, relationships strain
Part 2 (Midpoint): Confrontation with Luminos
Part 3 (Climax): Final revelation of Luminos's plan
Part 4 (Resolution): Aftermath and new understanding
```

**Step 2: Select thematic words for each part**

```
Part 0 words: trust, vision, clarity, doubt, question, shift
Part 1 words: evidence, betrayal, fear, alone, truth, fracture
Part 2 words: confront, anger, defend, accuse, break, divide
Part 3 words: reveal, power, control, ambition, sacrifice, fall
Part 4 words: aftermath, learn, wisdom, choice, future, hope
```

**Step 3: Write story excerpts**

**Part 0:**
```
"Luminos's latest proposal seemed reasonable on the surface, but something about the way he presented it to the council made you uneasy. The other founders didn't seem to notice, but you've known him longer than any of them. This isn't the collaborative visionary you co-founded the Kethaneum with."
```

**Part 1:**
```
"Over the following weeks, you quietly review old records. The pattern is undeniable: every major decision in the last year has gradually centralized power under Luminos's authority. When you try to discuss your concerns with the other founders, they dismiss your worries as paranoia. But the evidence doesn't lie."
```

**Part 2:**
```
"You can't stay silent any longer. At the next council meeting, you lay out everything you've discovered. The room falls silent as you speak. When you finish, Luminos stands slowly, his expression unreadable. 'I had hoped it wouldn't come to this,' he says softly. The other founders look between you two, uncertain."
```

**Part 3:**
```
"Luminos's mask drops. He speaks of 'perfecting' the Kethaneum's vision, of the 'necessary sacrifices' for ultimate clarity. The other founders recoil as they finally see what you've seen all along. But Luminos isn't finished. He reveals plans already in motion, changes already made that can't be easily undone. His 'perfect vision' requires total control."
```

**Part 4:**
```
"The council votes to limit Luminos's authority, but the damage is done. Trust has been shattered, friendships broken. As you walk the Kethaneum's halls afterward, you reflect on how power can corrupt even the best intentions. The archives will record this moment, and perhaps future generations will learn from it. Or perhaps they'll repeat the same mistakes. For now, all you can do is ensure the truth survives."
```

**Step 4: Create the JSON**

```json
[
  {
    "title": "The Betrayal of Luminos - Part 0 The First Doubt",
    "book": "The Betrayal of Luminos",
    "genre": "Kethaneum",
    "words": ["trust", "vision", "clarity", "doubt", "question", "shift"],
    "storyPart": 0,
    "storyExcerpt": "Luminos's latest proposal seemed reasonable on the surface..."
  },
  {
    "title": "The Betrayal of Luminos - Part 1 Evidence Mounts",
    "book": "The Betrayal of Luminos",
    "genre": "Kethaneum",
    "words": ["evidence", "betrayal", "fear", "alone", "truth", "fracture"],
    "storyPart": 1,
    "storyExcerpt": "Over the following weeks, you quietly review old records..."
  },
  {
    "title": "The Betrayal of Luminos - Part 2 Confrontation",
    "book": "The Betrayal of Luminos",
    "genre": "Kethaneum",
    "words": ["confront", "anger", "defend", "accuse", "break", "divide"],
    "storyPart": 2,
    "storyExcerpt": "You can't stay silent any longer..."
  },
  {
    "title": "The Betrayal of Luminos - Part 3 The Revelation",
    "book": "The Betrayal of Luminos",
    "genre": "Kethaneum",
    "words": ["reveal", "power", "control", "ambition", "sacrifice", "fall"],
    "storyPart": 3,
    "storyExcerpt": "Luminos's mask drops..."
  },
  {
    "title": "The Betrayal of Luminos - Part 4 Aftermath",
    "book": "The Betrayal of Luminos",
    "genre": "Kethaneum",
    "words": ["aftermath", "learn", "wisdom", "choice", "future", "hope"],
    "storyPart": 4,
    "storyExcerpt": "The council votes to limit Luminos's authority..."
  }
]
```

---

## Quick Reference

### Minimal Valid Puzzle

```json
{
  "title": "My Puzzle",
  "book": "My Book",
  "words": ["one", "two", "three", "four"]
}
```

### Complete Puzzle with All Fields

```json
{
  "title": "Complete Example - Part 1",
  "book": "Example Book",
  "genre": "Example",
  "words": ["example", "puzzle", "word", "list", "here", "today"],
  "storyPart": 0,
  "storyExcerpt": "This is an example story excerpt that provides narrative context for the puzzle."
}
```

### File Checklist

- [ ] File in `public/data/` directory
- [ ] Valid JSON syntax
- [ ] All puzzles have required fields (title, book, words)
- [ ] Titles are unique
- [ ] Words arrays have 4+ words
- [ ] File added to `genreManifest.json` (if new file)
- [ ] Tested in browser
- [ ] No console errors

---

## Related Documentation

- [Game Overview](../1-overview/GAME_OVERVIEW.md) - Understanding game mechanics
- [Puzzle System](../3-systems/PUZZLE_SYSTEM.md) - Technical details of puzzle system
- [Codebase Architecture](../2-architecture/CODEBASE_ARCHITECTURE.md) - Overall code structure
- [Documentation System](../DOCUMENTATION_SYSTEM.md) - Documentation standards

---

## Getting Help

**If you encounter issues:**

1. **Check the browser console (F12)** for error messages
2. **Validate JSON syntax** at jsonlint.com
3. **Review this guide** for common mistakes
4. **Check existing puzzle files** for examples
5. **Create an issue** on GitHub with:
   - Description of problem
   - Your puzzle JSON
   - Console error messages
   - Steps to reproduce

---

*This guide covers everything needed to add puzzles to Chronicles of the Kethaneum. Whether you're creating epic story arcs or simple word collections, following these practices will ensure your puzzles work seamlessly in the game.*
