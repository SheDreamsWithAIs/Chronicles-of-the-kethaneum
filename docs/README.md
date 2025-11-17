# Chronicles of the Kethaneum Documentation

Welcome to the comprehensive documentation for Chronicles of the Kethaneum - a word search puzzle game with an integrated narrative system, designed to evolve into a reusable game engine.

## Quick Navigation

### I'm looking to...

| Goal | Document |
|------|----------|
| **Get started as a new developer** | [Getting Started](1-overview/GETTING_STARTED.md) |
| **Understand how the game works** | [Game Overview](1-overview/GAME_OVERVIEW.md) |
| **See the architecture overview** | [Architecture Summary](1-overview/ARCHITECTURE_SUMMARY.md) |
| **Add new puzzles** | [Adding Puzzles Guide](5-guides/ADDING_PUZZLES.md) |
| **Add dialogue characters** | [Adding Characters Guide](5-guides/ADDING_CHARACTERS.md) |
| **Configure audio/music** | [Audio System](3-systems/AUDIO_SYSTEM.md) |
| **Look up a function or API** | [API Reference](4-api-reference/) |
| **Understand the game engine vision** | [Game Engine Vision](2-architecture/GAME_ENGINE_VISION.md) |
| **Plan refactoring to engine** | [Refactoring Roadmap](7-refactoring/REFACTORING_ROADMAP.md) |

---

## Documentation by Role

### 🎨 Content Creator
You want to add puzzles, characters, or audio to the game:

- **[Adding Puzzles](5-guides/ADDING_PUZZLES.md)** - Create word search puzzles
- **[Adding Characters](5-guides/ADDING_CHARACTERS.md)** - Create dialogue characters
- **[Adding Audio](5-guides/ADDING_AUDIO.md)** - Add music and sound effects
- **[Puzzle System Overview](3-systems/PUZZLE_SYSTEM.md)** - How puzzles work
- **[Dialogue System Overview](3-systems/DIALOGUE_SYSTEM.md)** - How dialogue works

### 💻 Developer
You want to understand the codebase and add features:

- **[Getting Started](1-overview/GETTING_STARTED.md)** - Setup and first steps
- **[Game Overview](1-overview/GAME_OVERVIEW.md)** - How the game works
- **[Architecture Summary](1-overview/ARCHITECTURE_SUMMARY.md)** - Quick architecture overview
- **[System Documentation](3-systems/)** - Individual system deep dives
- **[API Reference](4-api-reference/)** - Function and type references
- **[Comprehensive Architecture](2-architecture/CODEBASE_ARCHITECTURE.md)** - Full codebase analysis

### 🏗️ Architect
You want to refactor the code into a game engine:

- **[Game Engine Vision](2-architecture/GAME_ENGINE_VISION.md)** - Future architecture design
- **[Refactoring Roadmap](7-refactoring/REFACTORING_ROADMAP.md)** - Step-by-step refactoring plan
- **[Engine Abstraction](7-refactoring/ENGINE_ABSTRACTION.md)** - Separation strategy
- **[Plugin Architecture](7-refactoring/PLUGIN_ARCHITECTURE.md)** - Plugin system design
- **[Comprehensive Architecture](2-architecture/CODEBASE_ARCHITECTURE.md)** - Current state analysis

---

## Documentation Structure

```
docs/
├── README.md (you are here)          # Documentation hub
├── DOCUMENTATION_SYSTEM.md           # Documentation design and standards
│
├── 1-overview/                       # High-level understanding
│   ├── GETTING_STARTED.md            # Quick start guide
│   ├── GAME_OVERVIEW.md              # Game mechanics and features
│   ├── ARCHITECTURE_SUMMARY.md       # Quick architecture overview
│   └── ROADMAP.md                    # Future vision
│
├── 2-architecture/                   # Technical deep dives
│   ├── CODEBASE_ARCHITECTURE.md      # Comprehensive codebase analysis
│   ├── GAME_ENGINE_VISION.md         # Engine transformation design
│   ├── SYSTEM_DESIGN.md              # Architecture patterns
│   ├── DATA_FLOW.md                  # Data flow through the app
│   └── STATE_MANAGEMENT.md           # State architecture
│
├── 3-systems/                        # Individual system documentation
│   ├── AUDIO_SYSTEM.md               # Audio management system
│   ├── PUZZLE_SYSTEM.md              # Puzzle generation and loading
│   ├── DIALOGUE_SYSTEM.md            # Character dialogue system
│   ├── SAVE_SYSTEM.md                # Persistence system
│   ├── CONFIGURATION_SYSTEM.md       # Config and feature flags
│   └── TIMER_SYSTEM.md               # Timer mechanics
│
├── 4-api-reference/                  # Technical API docs
│   ├── CORE_API.md                   # Core game logic
│   ├── HOOKS_API.md                  # React hooks
│   ├── COMPONENTS_API.md             # Component interfaces
│   ├── TYPES_API.md                  # TypeScript types
│   └── UTILITIES_API.md              # Helper functions
│
├── 5-guides/                         # How-to guides
│   ├── ADDING_PUZZLES.md             # Create puzzles
│   ├── ADDING_CHARACTERS.md          # Create characters
│   ├── ADDING_GAME_MODES.md          # Add game modes
│   ├── ADDING_AUDIO.md               # Add audio files
│   ├── CUSTOMIZING_DIFFICULTY.md     # Adjust difficulty
│   └── TESTING_GUIDE.md              # Testing practices
│
├── 6-tutorials/                      # Step-by-step learning
│   ├── BUILDING_YOUR_FIRST_PUZZLE.md # Complete puzzle tutorial
│   ├── CREATING_A_CHARACTER.md       # Character tutorial
│   ├── BUILDING_A_NEW_GAME.md        # Use engine for new game
│   └── EXTENDING_THE_ENGINE.md       # Add custom systems
│
├── 7-refactoring/                    # Engine transformation
│   ├── REFACTORING_ROADMAP.md        # Refactoring plan
│   ├── ENGINE_ABSTRACTION.md         # Engine separation strategy
│   ├── PLUGIN_ARCHITECTURE.md        # Plugin system design
│   └── MIGRATION_GUIDE.md            # Migration instructions
│
└── 8-miscellaneous/                  # Other docs
    ├── BUILD_FIX_EXPLANATION.md      # Build process
    ├── TROUBLESHOOTING.md            # Common issues
    ├── PERFORMANCE.md                # Optimization guide
    └── CONTRIBUTING.md               # Contribution guide
```

---

## Project Overview

**Chronicles of the Kethaneum** is a Next.js-based word search puzzle game with sophisticated narrative integration. The project is designed to evolve from a single game into a reusable game engine for creating word search puzzle games.

### Key Statistics
- **Total Code**: ~6,000 lines (TypeScript/React)
- **Framework**: Next.js 16 + React 19
- **Game Modes**: 3 (Story, Puzzle-Only, Beat-the-Clock)
- **Systems**: 7 major systems (Game, Puzzle, Audio, Dialogue, Save, Config, UI)
- **Dependencies**: Zero game libraries (only React/Next.js)
- **Architecture Health**: 7/10
- **Current Reusability**: 40% | **Target**: 100%

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
3. Try **[Building Your First Puzzle](6-tutorials/BUILDING_YOUR_FIRST_PUZZLE.md)** - Hands-on learning

### For Content Creators
1. Read **[Adding Puzzles](5-guides/ADDING_PUZZLES.md)** - Create puzzles
2. Read **[Puzzle System](3-systems/PUZZLE_SYSTEM.md)** - Understand puzzle format
3. Use the Genre Builder tool (if available) or edit JSON directly

### For Architects
1. Read **[Architecture Summary](1-overview/ARCHITECTURE_SUMMARY.md)** - Quick overview
2. Read **[Comprehensive Architecture](2-architecture/CODEBASE_ARCHITECTURE.md)** - Full analysis
3. Read **[Game Engine Vision](2-architecture/GAME_ENGINE_VISION.md)** - Future design
4. Read **[Refactoring Roadmap](7-refactoring/REFACTORING_ROADMAP.md)** - Implementation plan

---

## Documentation Status

| Document | Status | Completeness | Priority |
|----------|--------|--------------|----------|
| Documentation System | ✅ Complete | 100% | High |
| Architecture Summary | ✅ Complete | 95% | High |
| Comprehensive Architecture | ✅ Complete | 95% | High |
| Audio System | ✅ Complete | 100% | Medium |
| Build Fix Explanation | ✅ Complete | 100% | Low |
| Getting Started | 🚧 In Progress | 0% | High |
| Game Overview | 🚧 In Progress | 0% | High |
| Game Engine Vision | 🚧 In Progress | 0% | High |
| Puzzle System | 🚧 In Progress | 0% | High |
| Adding Puzzles Guide | 🚧 In Progress | 0% | High |
| Refactoring Roadmap | 🚧 In Progress | 0% | High |
| Other Documentation | 📋 Planned | 0% | Medium-Low |

### Documentation Priorities

**Phase 1** (Immediate - Current Development):
1. ✅ Documentation System
2. ✅ Architecture Summary
3. ✅ Comprehensive Architecture
4. 🚧 Getting Started
5. 🚧 Game Overview
6. 🚧 Puzzle System
7. 🚧 Adding Puzzles Guide

**Phase 2** (Short-term - Developer Experience):
- API Reference (Core, Hooks, Components)
- Dialogue System
- Adding Characters Guide
- Testing Guide

**Phase 3** (Medium-term - Engine Transformation):
- Game Engine Vision
- Refactoring Roadmap
- Engine Abstraction
- Plugin Architecture

**Phase 4** (Long-term - Completeness):
- Tutorials
- Remaining system docs
- Migration guides
- Contributing guide

---

## Key Architectural Insights

### Current State
The codebase is a **well-structured game** with:
- Clean folder organization (lib/components/hooks)
- Type-safe TypeScript throughout
- Sophisticated systems (puzzle selection, audio, dialogue)
- Good separation at file level

### Challenge
Game-specific logic is **tightly coupled** with engine code:
- Puzzle data format assumes Kethaneum structure
- Puzzle selection hardcoded to "Kethaneum weaving"
- Dialogue system specific to character/story beat structure
- UI components tightly bound to game state

### Vision
Transform into a **reusable game engine** by:
1. Abstracting puzzle data format (generic + metadata)
2. Creating plugin-based puzzle selection strategies
3. Separating engine code from game content
4. Defining clear extension points for custom games

**Estimated Effort**: 4-6 weeks of focused refactoring
**Result**: Create new word search games in 1-2 weeks instead of months

---

## Contributing to Documentation

Documentation is as important as code. To contribute:

1. Follow the [Documentation Standards](DOCUMENTATION_SYSTEM.md#documentation-standards)
2. Use the [Documentation Template](DOCUMENTATION_SYSTEM.md) structure
3. Include working code examples
4. Cross-reference related documents
5. Keep examples synchronized with code changes

See **[Contributing Guide](8-miscellaneous/CONTRIBUTING.md)** for more details.

---

## Questions or Issues?

- Check **[Troubleshooting](8-miscellaneous/TROUBLESHOOTING.md)** for common issues
- Search existing documentation using your editor's search
- Create an issue if documentation is unclear or missing
- Contribute improvements via pull request

---

**Last Updated**: 2025-11-17
**Documentation Version**: 1.0
**Codebase Version**: Current (pre-engine-refactoring)

For the documentation system design and maintenance guidelines, see **[DOCUMENTATION_SYSTEM.md](DOCUMENTATION_SYSTEM.md)**.
