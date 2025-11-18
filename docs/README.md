# Chronicles of the Kethaneum Documentation

Welcome to the documentation for Chronicles of the Kethaneum - a word search puzzle game with an integrated narrative system.

**Note**: This folder contains **current-state documentation** (how the game works now). For future development plans, see `/development-plans/`.

## Quick Navigation

### I'm looking to...

| Goal | Document |
|------|----------|
| **Get started as a new developer** | [Getting Started](1-overview/GETTING_STARTED.md) |
| **Understand how the game works** | [Game Overview](1-overview/GAME_OVERVIEW.md) |
| **See the architecture overview** | [Architecture Summary](1-overview/ARCHITECTURE_SUMMARY.md) |
| **Add new puzzles** | [Adding Puzzles Guide](5-guides/ADDING_PUZZLES.md) |
| **Configure audio/music** | [Audio System](3-systems/AUDIO_SYSTEM.md) |
| **Understand the puzzle system** | [Puzzle System](3-systems/PUZZLE_SYSTEM.md) |
| **See future plans** | [Development Plans](/development-plans/) |

---

## Documentation by Role

### 🎨 Content Creator
You want to add puzzles or content to the game:

- **[Adding Puzzles](5-guides/ADDING_PUZZLES.md)** - Create word search puzzles
- **[Puzzle System Overview](3-systems/PUZZLE_SYSTEM.md)** - How puzzles work
- **[Audio System Overview](3-systems/AUDIO_SYSTEM.md)** - How audio works

### 💻 Developer
You want to understand the codebase and add features:

- **[Getting Started](1-overview/GETTING_STARTED.md)** - Setup and first steps
- **[Game Overview](1-overview/GAME_OVERVIEW.md)** - How the game works
- **[Architecture Summary](1-overview/ARCHITECTURE_SUMMARY.md)** - Quick architecture overview
- **[System Documentation](3-systems/)** - Individual system deep dives
- **[Comprehensive Architecture](2-architecture/CODEBASE_ARCHITECTURE.md)** - Full codebase analysis

### 🏗️ Planning Future Development
You want to see strategic plans for the project:

- **[Development Plans](/development-plans/)** - Future-state planning documents
- **[Game Engine Transformation](/development-plans/game-engine-transformation/)** - Plan to make this a reusable engine

---

## Documentation Structure

```
docs/
├── README.md (you are here)          # Documentation hub
│
├── 1-overview/                       # High-level understanding
│   ├── GETTING_STARTED.md            # Quick start guide
│   ├── GAME_OVERVIEW.md              # Game mechanics and features
│   └── ARCHITECTURE_SUMMARY.md       # Quick architecture overview
│
├── 2-architecture/                   # Technical deep dives
│   └── CODEBASE_ARCHITECTURE.md      # Comprehensive codebase analysis
│
├── 3-systems/                        # Individual system documentation
│   ├── AUDIO_SYSTEM.md               # Audio management system
│   └── PUZZLE_SYSTEM.md              # Puzzle generation and loading
│
├── 5-guides/                         # How-to guides
│   └── ADDING_PUZZLES.md             # Create puzzles
│
└── 8-miscellaneous/                  # Other docs
    └── BUILD_FIX_EXPLANATION.md      # Build process
```

**Note**: Additional documentation will be added as features are developed. For future plans and strategic direction, see `/development-plans/`.

---

## Project Overview

**Chronicles of the Kethaneum** is a Next.js-based word search puzzle game with sophisticated narrative integration.

### Key Statistics
- **Total Code**: ~6,000 lines (TypeScript/React)
- **Framework**: Next.js 16 + React 19
- **Game Modes**: 3 (Story, Puzzle-Only, Beat-the-Clock)
- **Systems**: 7 major systems (Game, Puzzle, Audio, Dialogue, Save, Config, UI)
- **Dependencies**: Zero game libraries (only React/Next.js)

### Special Features
- **Kethaneum Weaving**: Intelligent narrative puzzle interleaving
- **Seeded RNG**: Reproducible puzzle generation
- **8-Directional Words**: Advanced word placement
- **Story Beat System**: Narrative-aware dialogue
- **Web Audio API**: Custom audio system with 4 channels

---

## Getting Started Quickly

### For New Developers
1. Read **[Getting Started](1-overview/GETTING_STARTED.md)** - Setup instructions
2. Read **[Game Overview](1-overview/GAME_OVERVIEW.md)** - Understand the game
3. Try adding a puzzle using **[Adding Puzzles](5-guides/ADDING_PUZZLES.md)**

### For Content Creators
1. Read **[Adding Puzzles](5-guides/ADDING_PUZZLES.md)** - Create puzzles
2. Read **[Puzzle System](3-systems/PUZZLE_SYSTEM.md)** - Understand puzzle format
3. Use the Genre Builder tool (if available) or edit JSON directly

### For Strategic Planning
1. Read **[Architecture Summary](1-overview/ARCHITECTURE_SUMMARY.md)** - Current architecture
2. Read **[Comprehensive Architecture](2-architecture/CODEBASE_ARCHITECTURE.md)** - Full analysis
3. Explore **[Development Plans](/development-plans/)** - Future direction

---

## Documentation Status

| Document | Status | Completeness |
|----------|--------|--------------|
| Getting Started | ✅ Complete | 100% |
| Game Overview | ✅ Complete | 100% |
| Architecture Summary | ✅ Complete | 95% |
| Comprehensive Architecture | ✅ Complete | 95% |
| Puzzle System | ✅ Complete | 100% |
| Adding Puzzles Guide | ✅ Complete | 100% |
| Audio System | ✅ Complete | 100% |
| Build Fix Explanation | ✅ Complete | 100% |

### Future Documentation

Additional documentation will be added as features are developed:
- API references (Core, Hooks, Components, Types)
- Additional system docs (Dialogue, Save, Configuration, Timer)
- More how-to guides (Characters, Audio, Game Modes, Difficulty)
- Tutorials for common tasks
- Troubleshooting and FAQ

For strategic planning documents, see `/development-plans/`.

---

## Key Architectural Insights

The codebase is a **well-structured game** with:
- Clean folder organization (lib/components/hooks)
- Type-safe TypeScript throughout
- Sophisticated systems (puzzle selection, audio, dialogue)
- Good separation at file level
- ~6,000 lines of clean code
- Zero external game dependencies (only React/Next.js)

For detailed architecture analysis, see:
- **[Architecture Summary](1-overview/ARCHITECTURE_SUMMARY.md)** - Quick overview
- **[Comprehensive Architecture](2-architecture/CODEBASE_ARCHITECTURE.md)** - Full analysis

For future transformation plans, see:
- **[Development Plans](/development-plans/)** - Strategic planning documents

---

## Contributing to Documentation

Documentation is important! To contribute:

1. Write clear, concise explanations
2. Include working code examples with types
3. Cross-reference related documents
4. Keep examples synchronized with code changes
5. Test code examples before committing

---

## Questions or Issues?

- Search existing documentation using your editor's search
- Check the [Getting Started](1-overview/GETTING_STARTED.md) guide for setup issues
- Create an issue if documentation is unclear or missing
- Contribute improvements via pull request

---

**Last Updated**: 2025-11-18
**Current Documentation**: 8 documents covering game fundamentals and architecture

Start with **[Getting Started](1-overview/GETTING_STARTED.md)** if you're new to the project!
