# Save System Architecture Diagram

## Overview
The Chronicles of the Kethaneum save system uses a three-layer architecture with automatic migration, backward compatibility, and optimized storage.

## Main Architecture

```mermaid
graph TB
    subgraph "Application Layer"
        App[React Application]
        GameState[GameState]
        useGameState[useGameState Hook]
        AudioMgr[AudioManager]
    end

    subgraph "Save System API (Unified Layer)"
        UnifiedSave[unifiedSaveSystem.ts]
        SaveProgress[saveProgress]
        LoadProgress[loadProgress]
        GetInfo[getSaveSystemInfo]
        ClearAll[clearAllProgress]
    end

    subgraph "Storage Implementation"
        OptSave[optimizedSaveSystem.ts]
        LegacySave[saveSystem.ts - Legacy]
        Migration[migrations.ts]
    end

    subgraph "Storage Format"
        V2Format[V2 - Optimized Format<br/>~70-80% smaller]
        V1Format[V1 - Legacy Format<br/>JSON Arrays]
        Bitmap[progressBitmap.ts<br/>Bitwise encoding]
    end

    subgraph "Data Store"
        LocalStorage[(localStorage)]
        BackupStore[(Backup Storage)]
    end

    subgraph "Book Registry"
        BookReg[bookRegistry<br/>Title ⟷ ID mapping]
    end

    App --> useGameState
    useGameState --> GameState
    useGameState --> UnifiedSave
    GameState --> UnifiedSave
    AudioMgr --> UnifiedSave

    UnifiedSave --> SaveProgress
    UnifiedSave --> LoadProgress
    UnifiedSave --> GetInfo
    UnifiedSave --> ClearAll

    SaveProgress --> OptSave
    LoadProgress --> OptSave
    LoadProgress --> Migration
    LoadProgress --> LegacySave
    GetInfo --> OptSave

    OptSave --> V2Format
    LegacySave --> V1Format
    Migration --> V1Format
    Migration --> V2Format

    V2Format --> Bitmap
    OptSave --> BookReg
    Migration --> BookReg

    OptSave --> LocalStorage
    LegacySave --> LocalStorage
    Migration --> LocalStorage
    Migration --> BackupStore

    style UnifiedSave fill:#4CAF50,stroke:#2E7D32,color:#fff
    style OptSave fill:#2196F3,stroke:#1565C0,color:#fff
    style Migration fill:#FF9800,stroke:#E65100,color:#fff
    style V2Format fill:#9C27B0,stroke:#6A1B9A,color:#fff
    style GameState fill:#F44336,stroke:#C62828,color:#fff
```

## Save Flow

```mermaid
sequenceDiagram
    participant App
    participant Hook as useGameState
    participant Unified as unifiedSaveSystem
    participant Opt as optimizedSaveSystem
    participant Bitmap as progressBitmap
    participant Registry as bookRegistry
    participant LS as localStorage

    App->>Hook: Update game state
    activate Hook
    Hook->>Hook: Detect state change
    Hook->>Hook: Debounce (100ms)
    Hook->>Unified: saveProgress(state)
    activate Unified

    Unified->>Opt: saveOptimizedProgress(state)
    activate Opt

    Opt->>Registry: Load registry
    Registry-->>Opt: Book ID mappings

    Opt->>Opt: Convert titles to IDs
    Opt->>Bitmap: encodeParts(boolean[])
    Bitmap-->>Opt: bitmap number

    Opt->>Opt: Build OptimizedProgress
    Note over Opt: Compact format with<br/>short property names

    Opt->>LS: setItem('kethaneumProgress', JSON)
    LS-->>Opt: Success

    deactivate Opt
    deactivate Unified
    deactivate Hook
```

## Load Flow with Migration

```mermaid
sequenceDiagram
    participant App
    participant Hook as useGameState
    participant Unified as unifiedSaveSystem
    participant Migration as migrations
    participant Opt as optimizedSaveSystem
    participant Legacy as saveSystem
    participant Bitmap as progressBitmap
    participant Registry as bookRegistry
    participant LS as localStorage
    participant Backup as Backup Storage

    App->>Hook: Initialize
    Hook->>Unified: loadProgress()
    activate Unified

    Unified->>Migration: needsMigration()
    Migration->>LS: Check version

    alt Old Format Detected (V1)
        Migration-->>Unified: true
        Unified->>Migration: autoMigrate()
        activate Migration

        Migration->>LS: Load old data
        LS-->>Migration: V1 Format JSON

        Migration->>Backup: createBackup()
        Backup-->>Migration: Backup created

        Migration->>Registry: Load registry
        Registry-->>Migration: Mappings

        Migration->>Migration: Convert titles to IDs
        Migration->>Bitmap: encodeParts()
        Bitmap-->>Migration: bitmaps

        Migration->>Migration: Build V2 format
        Migration->>LS: Save migrated data

        Migration-->>Unified: Success + stats
        deactivate Migration

        Unified->>Opt: loadOptimizedProgress()

    else Already Optimized (V2)
        Migration-->>Unified: false
        Unified->>Opt: loadOptimizedProgress()
    end

    activate Opt
    Opt->>LS: getItem('kethaneumProgress')
    LS-->>Opt: V2 Format JSON

    Opt->>Opt: Parse JSON
    Opt->>Registry: Load registry
    Registry-->>Opt: Book metadata

    Opt->>Bitmap: decodeParts(bitmap, totalParts)
    Bitmap-->>Opt: boolean[]

    Opt->>Opt: Convert IDs to titles
    Opt-->>Unified: DecodedProgress
    deactivate Opt

    Unified->>Unified: convertToGameStateFormat()
    Unified-->>Hook: UnifiedLoadResult
    deactivate Unified

    Hook->>Hook: restoreGameState()
    Hook->>App: State restored
```

## Data Structure Flow

```mermaid
graph LR
    subgraph "GameState (Runtime)"
        GS_Books["books: {[title]: boolean[]}"]
        GS_Disc["discoveredBooks: Set<string>"]
        GS_Comp["completedPuzzlesByGenre: Map"]
        GS_Current["currentBook, currentStoryPart"]
        GS_Mode["gameMode, selectedGenre"]
        GS_Story["storyProgress"]
        GS_Dialog["dialogue.completedStoryEvents"]
        GS_Audio["audioSettings (from AudioManager)"]
    end

    subgraph "V2 - Optimized Format"
        V2_Ver["v: 2"]
        V2_Disc["d: 'id1,id2,id3'"]
        V2_Prog["p: {id: bitmap}"]
        V2_Genre["g: {genre: [ids]}"]
        V2_Mode["m: 's'|'p'|'b'"]
        V2_Current["c: {g, b, p, i}"]
        V2_Select["s: {g, k, p, i, r, e}"]
        V2_Story["sp: StoryProgressState"]
        V2_Dialog["dl: string[]"]
        V2_Audio["a: {mv, mu, av, sv, vv, ...}"]
    end

    subgraph "localStorage"
        LS_Key["kethaneumProgress"]
        LS_Backup["kethaneumProgress_backup_v1"]
    end

    GS_Books -->|Save: Title→ID<br/>Boolean[]→Bitmap| V2_Prog
    GS_Disc -->|Save: Set→CSV| V2_Disc
    GS_Comp -->|Save: Title→ID| V2_Genre
    GS_Current -->|Save: Compact| V2_Current
    GS_Mode -->|Save: Abbreviate| V2_Mode
    GS_Story -->|Save: Direct| V2_Story
    GS_Dialog -->|Save: Array| V2_Dialog
    GS_Audio -->|Save: Compact keys| V2_Audio

    V2_Ver --> LS_Key
    V2_Disc --> LS_Key
    V2_Prog --> LS_Key
    V2_Genre --> LS_Key
    V2_Mode --> LS_Key
    V2_Current --> LS_Key
    V2_Select --> LS_Key
    V2_Story --> LS_Key
    V2_Dialog --> LS_Key
    V2_Audio --> LS_Key

    V2_Disc -->|Load: CSV→Set| GS_Disc
    V2_Prog -->|Load: Bitmap→Boolean[]<br/>ID→Title| GS_Books
    V2_Genre -->|Load: ID→Title| GS_Comp
    V2_Current -->|Load: Expand| GS_Current
    V2_Mode -->|Load: Expand| GS_Mode
    V2_Story -->|Load: Direct| GS_Story
    V2_Dialog -->|Load: Array| GS_Dialog
    V2_Audio -->|Load: Expand keys| GS_Audio

    LS_Key -.->|Backup before migration| LS_Backup

    style GS_Books fill:#ffebee
    style GS_Disc fill:#ffebee
    style GS_Comp fill:#ffebee
    style V2_Prog fill:#e3f2fd
    style V2_Disc fill:#e3f2fd
    style V2_Genre fill:#e3f2fd
    style LS_Key fill:#fff3e0
```

## Bitmap Encoding System

```mermaid
graph TB
    subgraph "Boolean Array (V1)"
        BA["[true, false, true, false, true]<br/>Storage: ~25 bytes"]
    end

    subgraph "Bitmap Encoding (V2)"
        BN["Binary: 0b10101<br/>Decimal: 21<br/>Storage: 2 bytes"]
    end

    subgraph "Bitmap Operations"
        Encode["encodeParts(boolean[])<br/>→ number"]
        Decode["decodeParts(number, totalParts)<br/>→ boolean[]"]
        Complete["completePart(bitmap, index)"]
        IsComplete["isPartCompleted(bitmap, index)"]
        Count["getCompletedCount(bitmap)"]
        BookDone["isBookCompleted(bitmap, totalParts)"]
    end

    BA -->|encodeParts| BN
    BN -->|decodeParts| BA

    BN --> Encode
    BN --> Decode
    BN --> Complete
    BN --> IsComplete
    BN --> Count
    BN --> BookDone

    style BA fill:#ffcdd2
    style BN fill:#c8e6c9
    style Encode fill:#fff9c4
    style Decode fill:#fff9c4
```

## Migration Process

```mermaid
stateDiagram-v2
    [*] --> CheckFormat: Load Request

    CheckFormat --> V1Detected: No version field or v=1
    CheckFormat --> V2Detected: v >= 2
    CheckFormat --> NoData: localStorage empty

    V1Detected --> CreateBackup: Old format found
    CreateBackup --> LoadOldData: Backup created
    LoadOldData --> ConvertFormat: Parse V1 JSON

    ConvertFormat --> MapTitlesToIDs: Load book registry
    MapTitlesToIDs --> EncodeBitmaps: Convert titles
    EncodeBitmaps --> BuildV2: Create bitmaps
    BuildV2 --> SaveV2: Assemble V2 object

    SaveV2 --> MigrationSuccess: Write to localStorage
    SaveV2 --> MigrationFailed: Save error

    MigrationFailed --> RestoreBackup: Rollback
    RestoreBackup --> LoadV1: Use legacy loader

    MigrationSuccess --> LoadV2Data: Load migrated data
    V2Detected --> LoadV2Data: Already optimized

    LoadV2Data --> DecodeData: Parse V2 JSON
    DecodeData --> MapIDsToTitles: Load book registry
    MapIDsToTitles --> DecodeBitmaps: Convert IDs
    DecodeBitmaps --> BuildGameState: Create boolean arrays
    BuildGameState --> [*]: Return to app

    NoData --> [*]: Return null
    LoadV1 --> [*]: Return V1 data

    state ConvertFormat {
        [*] --> ParseJSON
        ParseJSON --> ValidateStructure
        ValidateStructure --> ExtractFields
        ExtractFields --> [*]
    }

    state BuildV2 {
        [*] --> CreateV2Object
        CreateV2Object --> AddRequiredFields
        AddRequiredFields --> AddOptionalFields
        AddOptionalFields --> CalculateStats
        CalculateStats --> [*]
    }
```

## Key Components and Responsibilities

```mermaid
graph TB
    subgraph "lib/save/index.ts"
        Index[Main Export Point<br/>Re-exports all functions]
    end

    subgraph "lib/save/unifiedSaveSystem.ts"
        Unified[Unified API<br/>• saveProgress<br/>• loadProgress<br/>• getSaveSystemInfo<br/>• clearAllProgress]
        UnifiedTypes[Types<br/>• UnifiedLoadResult<br/>• SaveSystemInfo]
    end

    subgraph "lib/save/optimizedSaveSystem.ts"
        Optimized[V2 Implementation<br/>• saveOptimizedProgress<br/>• loadOptimizedProgress<br/>• decodeOptimizedProgress<br/>• convertToGameStateFormat]
        OptTypes[Types<br/>• OptimizedProgress<br/>• DecodedProgress]
        Utils[Utilities<br/>• isOptimizedFormat<br/>• getSaveVersion<br/>• getStorageSize]
    end

    subgraph "lib/save/saveSystem.ts"
        Legacy[V1 Implementation<br/>DEPRECATED<br/>• saveGameProgress<br/>• loadGameProgress<br/>• saveAudioSettings<br/>• loadAudioSettings]
        LegacyTypes[Types<br/>• SavedProgress]
    end

    subgraph "lib/save/migrations.ts"
        Migrations[Migration System<br/>• needsMigration<br/>• autoMigrate<br/>• migrateV1toV2]
        Backup[Backup System<br/>• createBackup<br/>• restoreFromBackup<br/>• hasBackup]
        MigTypes[Types<br/>• MigrationResult<br/>• MigrationStats]
    end

    subgraph "lib/book/progressBitmap.ts"
        BitmapEnc[Encoding<br/>• encodeParts<br/>• decodeParts]
        BitmapOps[Operations<br/>• completePart<br/>• isPartCompleted<br/>• getCompletedCount]
    end

    subgraph "lib/book/bookRegistry.ts"
        Registry[Book Registry<br/>• getBookIdByTitle<br/>• getBook]
    end

    Index --> Unified
    Index --> Optimized
    Index --> Legacy
    Index --> Migrations

    Unified --> Optimized
    Unified --> Migrations
    Unified --> Legacy

    Optimized --> BitmapEnc
    Optimized --> BitmapOps
    Optimized --> Registry

    Migrations --> Optimized
    Migrations --> Legacy
    Migrations --> BitmapEnc
    Migrations --> Registry

    style Unified fill:#4CAF50,stroke:#2E7D32,color:#fff
    style Optimized fill:#2196F3,stroke:#1565C0,color:#fff
    style Legacy fill:#9E9E9E,stroke:#616161,color:#fff
    style Migrations fill:#FF9800,stroke:#E65100,color:#fff
    style BitmapEnc fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

## Storage Keys

```mermaid
graph LR
    subgraph "localStorage Keys"
        Main["kethaneumProgress<br/>Current save data"]
        Backup["kethaneumProgress_backup_v1<br/>Pre-migration backup"]
    end

    subgraph "Save Data Contents"
        V2["Version 2 (Optimized)<br/>• v: 2<br/>• d: CSV book IDs<br/>• p: bitmap map<br/>• g: genre puzzles<br/>• m: game mode<br/>• n: puzzle count<br/>• c: current state<br/>• s: selection state<br/>• sp: story progress<br/>• dl: dialogue events<br/>• a: audio settings"]

        V1["Version 1 (Legacy)<br/>• completedPuzzles<br/>• completedBooks<br/>• books: object<br/>• discoveredBooks: array<br/>• bookProgress<br/>• currentGenre<br/>• currentBook<br/>• storyProgress"]
    end

    Main -.->|Contains| V2
    Main -.->|Or contains| V1
    Backup -.->|Contains| V1

    style Main fill:#fff3e0
    style Backup fill:#ffe0b2
    style V2 fill:#e3f2fd
    style V1 fill:#f5f5f5
```

## System Integration Points

```mermaid
graph TB
    subgraph "Entry Points"
        UseGameState["hooks/useGameState.ts<br/>React hook for state management"]
        Components["React Components<br/>SettingsMenu, GameScreen, etc."]
    end

    subgraph "Save System"
        SaveSys["lib/save/*<br/>Save system modules"]
    end

    subgraph "Data Sources"
        GameStateFile["lib/game/state.ts<br/>GameState interface & logic"]
        AudioMgrFile["lib/audio/audioManager.ts<br/>Audio settings"]
        StoryTypes["lib/story/types.ts<br/>Story progress types"]
        BookReg["lib/book/bookRegistry.ts<br/>Book metadata"]
    end

    subgraph "Storage"
        Browser["Browser localStorage API"]
    end

    UseGameState --> SaveSys
    Components --> UseGameState

    SaveSys --> GameStateFile
    SaveSys --> AudioMgrFile
    SaveSys --> StoryTypes
    SaveSys --> BookReg
    SaveSys --> Browser

    GameStateFile -.->|Provides types| UseGameState
    AudioMgrFile -.->|Provides settings| SaveSys
    StoryTypes -.->|Provides types| GameStateFile
    BookReg -.->|Title/ID mapping| SaveSys

    style UseGameState fill:#f44336,stroke:#c62828,color:#fff
    style SaveSys fill:#4caf50,stroke:#2e7d32,color:#fff
    style Browser fill:#ff9800,stroke:#e65100,color:#fff
```

## Critical Save Points

```mermaid
flowchart TD
    Start[Game State Change]

    Start --> Debounce{Debounce<br/>100ms}
    Debounce -->|Timer expires| Check{Already<br/>saving?}
    Debounce -->|Timer reset| Start

    Check -->|Yes| Wait[Wait]
    Check -->|No| StateHash{State<br/>changed?}

    StateHash -->|No| Skip[Skip save]
    StateHash -->|Yes| Save[Save to localStorage]

    Save --> Success{Success?}
    Success -->|Yes| Update[Update lastSavedState]
    Success -->|No| Error[Log error]

    Update --> End[Done]
    Error --> End
    Skip --> End
    Wait --> End

    style Start fill:#e3f2fd
    style Save fill:#c8e6c9
    style Error fill:#ffcdd2
    style Update fill:#c8e6c9
    style Skip fill:#fff9c4
```

## Error Handling & Fallbacks

```mermaid
flowchart TD
    LoadAttempt[Attempt Load]

    LoadAttempt --> CheckMigration{Migration<br/>needed?}

    CheckMigration -->|Yes| TryMigration[autoMigrate]
    CheckMigration -->|No| TryOptimized[loadOptimizedProgress]

    TryMigration --> MigrationSuccess{Success?}
    MigrationSuccess -->|Yes| LoadOptimized[Load V2 data]
    MigrationSuccess -->|No| MigrationFallback[Try legacy load]

    TryOptimized --> OptSuccess{Success?}
    OptSuccess -->|Yes| LoadOptimized
    OptSuccess -->|No| TryLegacy[loadGameProgress]

    MigrationFallback --> TryLegacy

    TryLegacy --> LegacySuccess{Success?}
    LegacySuccess -->|Yes| ConvertLegacy[Convert to GameState]
    LegacySuccess -->|No| NoData[Return null - fresh state]

    LoadOptimized --> ConvertOptimized[convertToGameStateFormat]
    ConvertOptimized --> RestoreState[restoreGameState]
    ConvertLegacy --> RestoreState

    RestoreState --> Done[Return to app]
    NoData --> Done

    style LoadAttempt fill:#e3f2fd
    style LoadOptimized fill:#c8e6c9
    style ConvertLegacy fill:#c8e6c9
    style ConvertOptimized fill:#c8e6c9
    style RestoreState fill:#c8e6c9
    style NoData fill:#fff9c4
    style MigrationFallback fill:#ffe0b2
```

## Testing Considerations

Key areas to test when modifying the save system:

1. **Save/Load Cycle**: Data integrity after save→load→save
2. **Migration**: V1→V2 conversion accuracy and rollback
3. **Backward Compatibility**: New code loads old saves correctly
4. **Bitmap Encoding**: All 32 bits work correctly
5. **Book Registry**: Title↔ID mapping consistency
6. **Audio Settings**: Settings persist correctly
7. **Story Progress**: Dialogue events and story state persist
8. **Error Recovery**: Graceful degradation on corruption
9. **Storage Size**: Verify ~70-80% reduction in V2
10. **Genre Selection**: selectedGenre fallback to currentGenre

## Performance Characteristics

- **Save Operation**: ~2-5ms (bitmap encoding + JSON stringify)
- **Load Operation**: ~5-10ms (JSON parse + bitmap decoding)
- **Migration**: ~10-50ms (depends on data size)
- **Storage Size**: V1: 5-15 KB typical, V2: 1-4 KB typical
- **Debounce**: 100ms prevents excessive saves during rapid state changes

## Future Considerations

1. **IndexedDB Migration**: For larger datasets beyond localStorage limits
2. **Cloud Sync**: Optional account-based save synchronization
3. **Compression**: Gzip/LZ compression for V3 format
4. **Versioned Slots**: Multiple save slots with timestamps
5. **Incremental Saves**: Delta-based saves for even better performance
6. **Export/Import**: Save file portability for backups
