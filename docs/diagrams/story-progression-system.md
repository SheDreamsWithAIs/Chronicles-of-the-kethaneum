# Story Progression System Architecture Diagram

## Overview
The Chronicles of the Kethaneum uses a dual-track narrative system that combines **Story Beats** (macro progression) with **Story Blurbs** (micro narrative moments) and **Story Events** (character dialogue sequences).

## Main Architecture

```mermaid
graph TB
    subgraph "Game Systems"
        GameLogic[Game Logic<br/>Puzzle Completion]
        GameState[GameState<br/>Progress Tracking]
    end

    subgraph "Story Progression System"
        SPM[StoryProgressionManager<br/>Story Beat Conductor]
        SPMConfig[story-progression-config.json<br/>Rules & Thresholds]
        ProgRules[Progression Rules<br/>When to advance beats]
    end

    subgraph "Story Blurb System"
        SBM[storyBlurbManager<br/>Narrative Moments]
        SBMData[story-progress.json<br/>Blurb Content]
        BlurbTriggers[Trigger Conditions<br/>When to unlock blurbs]
    end

    subgraph "Story Event System"
        SETC[StoryEventTriggerChecker<br/>Event Condition Checker]
        SEP[StoryEventPlayer<br/>Dialogue Sequencer]
        DM[DialogueManager<br/>Character & Event Manager]
        Events[Story Events<br/>Multi-character dialogue]
    end

    subgraph "Supporting Systems"
        AudioMgr[AudioManager<br/>Music by Story Beat]
        CharLoader[Character Loader<br/>Load by Story Beat]
    end

    subgraph "React Hooks"
        UseStoryProg[useStoryProgress<br/>Blurb Management]
        UseProgHook[useStoryProgression<br/>Beat Progression]
    end

    subgraph "Data Storage"
        SaveSys[Save System<br/>Persist Progress]
    end

    GameLogic --> GameState
    GameState --> SPM
    GameState --> SBM
    GameState --> SETC

    SPM --> SPMConfig
    SPM --> ProgRules
    SPM --> DM
    SPM --> AudioMgr
    SPM --> CharLoader

    SBM --> SBMData
    SBM --> BlurbTriggers

    SETC --> Events
    SETC --> DM
    SEP --> DM
    SEP --> Events

    UseStoryProg --> SBM
    UseProgHook --> SPM

    GameState --> SaveSys
    SaveSys -.->|Load| GameState

    style SPM fill:#4CAF50,stroke:#2E7D32,color:#fff
    style SBM fill:#2196F3,stroke:#1565C0,color:#fff
    style SETC fill:#FF9800,stroke:#E65100,color:#fff
    style DM fill:#9C27B0,stroke:#6A1B9A,color:#fff
    style GameState fill:#F44336,stroke:#C62828,color:#fff
```

## Story Beat Progression Flow

```mermaid
stateDiagram-v2
    [*] --> hook: Game Start

    hook --> first_plot_point: 10+ puzzles OR<br/>5+ books discovered

    first_plot_point --> first_pinch_point: 25+ puzzles OR<br/>10+ books

    first_pinch_point --> midpoint: 50+ puzzles OR<br/>25+ books

    midpoint --> second_pinch_point: 75+ puzzles OR<br/>40+ books

    second_pinch_point --> second_plot_point: 100+ puzzles OR<br/>50+ books

    second_plot_point --> climax: 150+ puzzles OR<br/>75+ books

    climax --> resolution: 200+ puzzles OR<br/>100+ books

    resolution --> [*]: Story Complete

    note right of hook
        Story Beat determines:
        - Background music
        - Available characters
        - Story events
        - Unlockable blurbs
    end note
```

## Complete Story Progression Sequence

```mermaid
sequenceDiagram
    participant Player
    participant PuzzleLogic as Puzzle Logic
    participant GameState
    participant SPM as StoryProgressionManager
    participant SBM as storyBlurbManager
    participant SETC as StoryEventTriggerChecker
    participant DM as DialogueManager
    participant AudioMgr as AudioManager
    participant UI

    Player->>PuzzleLogic: Complete puzzle
    PuzzleLogic->>GameState: Update completedPuzzles++

    Note over GameState: State updated with<br/>new progress

    GameState->>SPM: checkAndAdvanceStory(metrics)
    activate SPM

    SPM->>SPM: Check progression rules
    SPM->>SPM: Find applicable rule

    alt Rule conditions met
        SPM->>DM: setStoryBeat(newBeat)
        DM-->>SPM: Beat changed

        SPM->>AudioMgr: updateMusic(newBeat)
        AudioMgr-->>SPM: Music changed

        SPM->>DM: loadCharacterGroups(newBeat)
        DM-->>SPM: Characters loaded

        SPM->>SPM: Emit beatChanged event
        SPM->>SPM: Emit beatTrigger event
    end

    deactivate SPM

    GameState->>SBM: checkTriggerConditions(state, prevState)
    activate SBM

    SBM->>SBM: Check milestones

    alt Trigger conditions met
        SBM->>SBM: getBlurbForTrigger()
        SBM->>SBM: unlockBlurb()
        SBM-->>GameState: Updated StoryProgressState
        GameState->>UI: Show blurb notification
    end

    deactivate SBM

    GameState->>SETC: checkAvailableEvents(state, prevState)
    activate SETC

    SETC->>SETC: Get events for current beat
    SETC->>SETC: Check trigger patterns

    alt Event trigger matched
        SETC-->>GameState: [eventId]
        GameState->>UI: Trigger story event
        UI->>DM: Play event(eventId)
        DM->>DM: Load event data
        DM-->>UI: Event ready
    end

    deactivate SETC

    GameState->>GameState: Save progress
```

## Story Blurb System Detail

```mermaid
graph TB
    subgraph "Trigger Types"
        GameStart[game_start]
        FirstPuzzle[first_puzzle_complete]
        FirstBook[first_book_complete]
        PuzzleMilestone[puzzles_complete_10/25/50/100]
        BookDisc[books_discovered_5/10/25/50/100]
        BookComp[books_complete_5/10/25]
        KethReveal[kethaneum_genre_revealed]
        KethFirst[kethaneum_first_puzzle]
        KethBook[kethaneum_book_complete]
        BeatTrigger[story_beat_*]
    end

    subgraph "Blurb Data"
        BlurbJSON[story-progress.json]
        BlurbDef[StoryBlurb<br/>id, title, text, trigger, storyBeat]
        TrigConfig[Trigger Config<br/>Milestones, behavior]
    end

    subgraph "State Tracking"
        StoryState[StoryProgressState]
        UnlockedList[unlockedBlurbs: string[]]
        FiredList[firedTriggers: StoryTrigger[]]
        CurrentBeat[currentStoryBeat: StoryBeat]
        CurrentBlurb[currentBlurbId: string]
    end

    subgraph "Manager Logic"
        SBM[storyBlurbManager]
        CheckTrig[checkTriggerConditions]
        GetBlurb[getBlurbForTrigger]
        Unlock[unlockBlurb]
    end

    BlurbJSON --> BlurbDef
    BlurbJSON --> TrigConfig

    BlurbDef --> SBM
    TrigConfig --> SBM

    GameStart --> CheckTrig
    FirstPuzzle --> CheckTrig
    FirstBook --> CheckTrig
    PuzzleMilestone --> CheckTrig
    BookDisc --> CheckTrig
    BookComp --> CheckTrig
    KethReveal --> CheckTrig
    KethFirst --> CheckTrig
    KethBook --> CheckTrig
    BeatTrigger --> CheckTrig

    CheckTrig --> GetBlurb
    GetBlurb --> Unlock

    Unlock --> UnlockedList
    Unlock --> FiredList
    Unlock --> CurrentBlurb

    UnlockedList --> StoryState
    FiredList --> StoryState
    CurrentBeat --> StoryState
    CurrentBlurb --> StoryState

    StoryState -.->|Saved to| SaveSystem[(localStorage)]

    style SBM fill:#2196F3,stroke:#1565C0,color:#fff
    style StoryState fill:#F44336,stroke:#C62828,color:#fff
    style CheckTrig fill:#4CAF50,stroke:#2E7D32,color:#fff
```

## Story Progression Manager Detail

```mermaid
graph TB
    subgraph "Configuration"
        Config[story-progression-config.json]
        Rules[progressionRules]
        Music[musicMapping]
        EventMap[storyEventTriggers]
        CharGroups[characterGroupLoading]
        Settings[settings]
    end

    subgraph "Progression Rules"
        Rule[ProgressionRule]
        FromBeat[fromBeat: StoryBeat]
        ToBeat[toBeat: StoryBeat]
        Conditions[conditions: thresholds]
        Priority[priority: number]
    end

    subgraph "Metrics Input"
        Metrics[ProgressionMetrics]
        CompPuzz[completedPuzzles]
        DiscBooks[discoveredBooks]
        CompBooks[completedBooks]
    end

    subgraph "Manager Actions"
        SPM[StoryProgressionManager]
        CheckRules[findApplicableRule]
        Advance[advanceStorybeat]
        UpdateMusic[updateMusic]
        TriggerEvent[triggerStoryEvent]
        LoadChars[loadCharacterGroups]
    end

    subgraph "Events Emitted"
        BeatChanged[beatChanged event]
        BeatTrigger[beatTrigger event]
        EventTrig[storyEventTriggered]
        ProgChanged[storyProgressionChanged]
    end

    Config --> Rules
    Config --> Music
    Config --> EventMap
    Config --> CharGroups
    Config --> Settings

    Rules --> Rule
    Rule --> FromBeat
    Rule --> ToBeat
    Rule --> Conditions
    Rule --> Priority

    Metrics --> CompPuzz
    Metrics --> DiscBooks
    Metrics --> CompBooks

    CompPuzz --> CheckRules
    DiscBooks --> CheckRules
    CompBooks --> CheckRules

    Conditions --> CheckRules
    FromBeat --> CheckRules
    Priority --> CheckRules

    CheckRules --> Advance
    Advance --> UpdateMusic
    Advance --> TriggerEvent
    Advance --> LoadChars

    UpdateMusic --> BeatChanged
    TriggerEvent --> EventTrig
    LoadChars --> ProgChanged
    Advance --> BeatTrigger

    Music --> UpdateMusic
    EventMap --> TriggerEvent
    CharGroups --> LoadChars

    style SPM fill:#4CAF50,stroke:#2E7D32,color:#fff
    style CheckRules fill:#FF9800,stroke:#E65100,color:#fff
    style Advance fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

## Story Event System Flow

```mermaid
graph TB
    subgraph "Event Trigger Checking"
        SETC[StoryEventTriggerChecker]
        EventIndex[Event Index<br/>By Story Beat]
        TriggerPatterns[Trigger Patterns<br/>Regex matching]
    end

    subgraph "Trigger Patterns"
        FirstPuzz[first-puzzle-complete]
        PuzzMilestone[puzzle-milestone-N]
        FirstKeth[first-kethaneum-puzzle-complete]
        KethMilestone[kethaneum-puzzle-milestone-N]
        FirstBook[first-book-complete]
        BooksComp[books-complete-N]
        KethBookComp[kethaneum-book-complete-title]
        LibraryVisit[player-enters-library-first-time]
    end

    subgraph "Event Playback"
        SEP[StoryEventPlayer]
        LoadEvent[loadStoryEvent]
        PlaySeq[Play dialogue sequence]
        ChunkText[Chunk text for display]
        PreloadPort[Preload portraits]
    end

    subgraph "Dialogue Management"
        DM[DialogueManager]
        Characters[Character Data]
        Events[Story Events]
        CharGroups[Character Groups<br/>by LoadingGroup]
    end

    subgraph "UI Display"
        DialogueQueue[DialogueQueue Component]
        Panels[Dialogue Panels]
        Portraits[Character Portraits]
    end

    SETC --> EventIndex
    SETC --> TriggerPatterns

    FirstPuzz --> SETC
    PuzzMilestone --> SETC
    FirstKeth --> SETC
    KethMilestone --> SETC
    FirstBook --> SETC
    BooksComp --> SETC
    KethBookComp --> SETC
    LibraryVisit --> SETC

    SETC -->|Event IDs| SEP

    SEP --> LoadEvent
    LoadEvent --> DM
    DM --> Characters
    DM --> Events
    DM --> CharGroups

    SEP --> PlaySeq
    PlaySeq --> ChunkText
    SEP --> PreloadPort

    PlaySeq --> DialogueQueue
    DialogueQueue --> Panels
    Panels --> Portraits

    style SETC fill:#FF9800,stroke:#E65100,color:#fff
    style SEP fill:#9C27B0,stroke:#6A1B9A,color:#fff
    style DM fill:#673AB7,stroke:#4527A0,color:#fff
```

## Character Loading System

```mermaid
graph LR
    subgraph "Story Beats → Loading Groups"
        Hook[hook]
        FPP[first_plot_point]
        Midpoint[midpoint]
        Climax[climax]
    end

    subgraph "Loading Groups"
        IntroChars[introduction_characters]
        RegContacts[regular_contacts]
        EssLibStaff[essential_library_staff]
        ExtLibStaff[extended_library_staff]
        LongScholars[long_term_scholars]
        VisitScholars[visiting_scholars]
        VisitDign[visiting_dignitaries]
        KnowContrib[knowledge_contributors]
        SpecialEvent[special_event_characters]
    end

    subgraph "Character Data"
        CharFile[Character JSON]
        CharDef[Character definition]
        BanterDialogue[Banter dialogue]
        Metadata[Metadata]
    end

    Hook --> IntroChars
    Hook --> RegContacts

    FPP --> EssLibStaff
    FPP --> LongScholars

    Midpoint --> ExtLibStaff
    Midpoint --> VisitScholars

    Climax --> VisitDign
    Climax --> KnowContrib
    Climax --> SpecialEvent

    IntroChars --> CharFile
    RegContacts --> CharFile
    EssLibStaff --> CharFile
    ExtLibStaff --> CharFile
    LongScholars --> CharFile
    VisitScholars --> CharFile
    VisitDign --> CharFile
    KnowContrib --> CharFile
    SpecialEvent --> CharFile

    CharFile --> CharDef
    CharFile --> BanterDialogue
    CharFile --> Metadata

    style IntroChars fill:#4CAF50,stroke:#2E7D32,color:#fff
    style EssLibStaff fill:#2196F3,stroke:#1565C0,color:#fff
    style ExtLibStaff fill:#FF9800,stroke:#E65100,color:#fff
```

## Data Structures

```mermaid
graph TB
    subgraph "StoryProgressState (Blurbs)"
        SPS[StoryProgressState]
        SPS_Current[currentBlurbId: string]
        SPS_Unlocked[unlockedBlurbs: string[]]
        SPS_Beat[currentStoryBeat: StoryBeat]
        SPS_Updated[lastUpdated: number]
        SPS_Fired[firedTriggers: StoryTrigger[]]
    end

    subgraph "StoryBlurb"
        Blurb[StoryBlurb]
        B_ID[id: string]
        B_Beat[storyBeat: StoryBeat]
        B_Trig[trigger: StoryTrigger]
        B_Title[title: string]
        B_Text[text: string]
        B_Order[order: number]
    end

    subgraph "ProgressionRule"
        Rule[ProgressionRule]
        R_ID[id: string]
        R_From[fromBeat: StoryBeat]
        R_To[toBeat: StoryBeat]
        R_Desc[description: string]
        R_Cond[conditions: thresholds]
        R_Pri[priority: number]
    end

    subgraph "StoryEvent"
        Event[StoryEvent]
        E_Info[storyEvent: metadata]
        E_Dialogue[dialogue: sequence[]]
        E_Chars[characters: refs[]]
        E_Meta[metadata: duration, importance]
    end

    subgraph "StoryEventDialogue"
        Dialogue[StoryEventDialogue]
        D_Seq[sequence: number]
        D_Speaker[speaker: characterId]
        D_Text[text: string]
        D_Emotion[emotion: Emotion[]]
        D_Pause[pauseAfter: boolean]
    end

    SPS --> SPS_Current
    SPS --> SPS_Unlocked
    SPS --> SPS_Beat
    SPS --> SPS_Updated
    SPS --> SPS_Fired

    Blurb --> B_ID
    Blurb --> B_Beat
    Blurb --> B_Trig
    Blurb --> B_Title
    Blurb --> B_Text
    Blurb --> B_Order

    Rule --> R_ID
    Rule --> R_From
    Rule --> R_To
    Rule --> R_Desc
    Rule --> R_Cond
    Rule --> R_Pri

    Event --> E_Info
    Event --> E_Dialogue
    Event --> E_Chars
    Event --> E_Meta

    Dialogue --> D_Seq
    Dialogue --> D_Speaker
    Dialogue --> D_Text
    Dialogue --> D_Emotion
    Dialogue --> D_Pause

    style SPS fill:#F44336,stroke:#C62828,color:#fff
    style Blurb fill:#2196F3,stroke:#1565C0,color:#fff
    style Rule fill:#4CAF50,stroke:#2E7D32,color:#fff
    style Event fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

## Integration with Game Systems

```mermaid
graph TB
    subgraph "Puzzle Completion Flow"
        PuzzComplete[Puzzle Complete]
        UpdateState[Update GameState]
        CheckProg[Check Progression]
        CheckBlurb[Check Blurb Triggers]
        CheckEvent[Check Story Events]
    end

    subgraph "State Updates"
        IncrPuzzles[completedPuzzles++]
        UpdateGenre[completedPuzzlesByGenre]
        UpdateBook[books[title][part] = true]
        CheckBookComp[Check if book complete]
        IncrBooks[completedBooks++]
    end

    subgraph "Story System Responses"
        AdvanceBeat[Advance Story Beat?]
        UnlockBlurb[Unlock Blurb?]
        TriggerEvent[Trigger Event?]
        ChangeMus[Change Music?]
        LoadChars[Load Characters?]
    end

    subgraph "UI Updates"
        ShowBlurb[Show Blurb Notification]
        PlayEvent[Play Story Event]
        UpdateMusic[Fade to New Music]
        SaveProg[Save Progress]
    end

    PuzzComplete --> UpdateState
    UpdateState --> IncrPuzzles
    UpdateState --> UpdateGenre
    UpdateState --> UpdateBook
    UpdateBook --> CheckBookComp
    CheckBookComp -->|Yes| IncrBooks

    IncrPuzzles --> CheckProg
    IncrBooks --> CheckProg

    CheckProg --> AdvanceBeat
    CheckProg --> CheckBlurb
    CheckProg --> CheckEvent

    AdvanceBeat -->|Yes| ChangeMus
    AdvanceBeat -->|Yes| LoadChars

    CheckBlurb --> UnlockBlurb
    CheckEvent --> TriggerEvent

    UnlockBlurb -->|Yes| ShowBlurb
    TriggerEvent -->|Yes| PlayEvent
    ChangeMus -->|Yes| UpdateMusic

    ShowBlurb --> SaveProg
    PlayEvent --> SaveProg
    UpdateMusic --> SaveProg

    style PuzzComplete fill:#4CAF50,stroke:#2E7D32,color:#fff
    style UpdateState fill:#F44336,stroke:#C62828,color:#fff
    style AdvanceBeat fill:#FF9800,stroke:#E65100,color:#fff
    style UnlockBlurb fill:#2196F3,stroke:#1565C0,color:#fff
    style TriggerEvent fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

## File Structure & Configuration

```mermaid
graph TB
    subgraph "Data Files"
        ProgConfig[/data/story-progression-config.json<br/>Story beat rules & transitions]
        BlurbData[/data/story-progress.json<br/>Narrative blurbs & triggers]
        CharFiles[/data/characters/*.json<br/>Character definitions]
        EventFiles[/data/story-events/*.json<br/>Story event dialogues]
    end

    subgraph "Core Managers"
        SPM[lib/story/StoryProgressionManager.ts<br/>Beat progression conductor]
        SBM[lib/story/storyBlurbManager.ts<br/>Blurb system manager]
        DM[lib/dialogue/DialogueManager.ts<br/>Character & event manager]
        SETC[lib/dialogue/StoryEventTriggerChecker.ts<br/>Event trigger checker]
        SEP[lib/dialogue/StoryEventPlayer.ts<br/>Event playback sequencer]
    end

    subgraph "Type Definitions"
        StoryTypes[lib/story/types.ts<br/>Blurb & progression types]
        DialogueTypes[lib/dialogue/types.ts<br/>Character & event types]
    end

    subgraph "React Hooks"
        UseStoryProg[hooks/useStoryProgress.ts<br/>Blurb management hook]
        UseProgHook[hooks/story/useStoryProgression.ts<br/>Beat progression hook]
    end

    subgraph "UI Components"
        Provider[components/StorySystemProvider.tsx<br/>Story system initialization]
        BlurbNotif[components/StoryBlurbNotification.tsx<br/>Blurb display]
        DialogueQ[components/dialogue/DialogueQueue.tsx<br/>Event dialogue display]
    end

    ProgConfig --> SPM
    BlurbData --> SBM
    CharFiles --> DM
    EventFiles --> DM

    SPM --> StoryTypes
    SBM --> StoryTypes
    DM --> DialogueTypes
    SETC --> DialogueTypes
    SEP --> DialogueTypes

    SPM --> UseProgHook
    SBM --> UseStoryProg

    UseProgHook --> Provider
    UseStoryProg --> Provider

    Provider --> BlurbNotif
    Provider --> DialogueQ

    style ProgConfig fill:#fff3e0
    style BlurbData fill:#fff3e0
    style SPM fill:#4CAF50,stroke:#2E7D32,color:#fff
    style SBM fill:#2196F3,stroke:#1565C0,color:#fff
    style DM fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

## Event Trigger Optimization

```mermaid
graph TB
    subgraph "Event Index System"
        AllEvents[All Story Events<br/>~50 total]
        BuildIndex[Build Index Once<br/>On load]
        ByBeat[Index by Story Beat<br/>~5-10 events per beat]
        ByPattern[Index by Pattern Type<br/>milestone, book, etc.]
    end

    subgraph "Checking Process"
        Check[Check on puzzle complete]
        CurrentBeat[Get current story beat]
        FilterEvents[Filter: events for beat only]
        MatchPattern[Match trigger patterns<br/>Pre-compiled regex]
        Return[Return matched events]
    end

    subgraph "Performance"
        Before[❌ Before: Check ~50 events]
        After[✅ After: Check ~5-10 events]
        Speedup[~5-10x faster checking]
    end

    AllEvents --> BuildIndex
    BuildIndex --> ByBeat
    BuildIndex --> ByPattern

    Check --> CurrentBeat
    CurrentBeat --> FilterEvents
    FilterEvents --> ByBeat
    ByBeat --> MatchPattern
    MatchPattern --> Return

    Before -.->|Optimization| After
    After --> Speedup

    style BuildIndex fill:#4CAF50,stroke:#2E7D32,color:#fff
    style FilterEvents fill:#2196F3,stroke:#1565C0,color:#fff
    style After fill:#c8e6c9
    style Before fill:#ffcdd2
```

## Trigger Condition Examples

```mermaid
graph LR
    subgraph "Simple Triggers"
        T1["'first-puzzle-complete'<br/>completedPuzzles === 1"]
        T2["'first-book-complete'<br/>completedBooks === 1"]
        T3["'player-enters-library-first-time'<br/>!hasVisitedLibrary"]
    end

    subgraph "Milestone Triggers"
        T4["'puzzle-milestone-25'<br/>completedPuzzles >= 25"]
        T5["'books-complete-10'<br/>completedBooks >= 10"]
        T6["'kethaneum-puzzle-milestone-5'<br/>kethaneum puzzles >= 5"]
    end

    subgraph "Complex Triggers"
        T7["'kethaneum-book-complete-title'<br/>All puzzles in book done"]
        T8["Story beat transitions<br/>Auto-fired on beat change"]
    end

    subgraph "State Comparison"
        Curr[Current State]
        Prev[Previous State]
        Delta[Detect Transition<br/>curr >= threshold<br/>prev < threshold]
    end

    T1 --> Delta
    T2 --> Delta
    T4 --> Delta
    T5 --> Delta
    T6 --> Delta
    T7 --> Delta

    Curr --> Delta
    Prev --> Delta

    style Delta fill:#4CAF50,stroke:#2E7D32,color:#fff
```

## Story Beat Transitions & Effects

```mermaid
graph TB
    subgraph "Beat: hook"
        H_Music[Music: introduction-theme]
        H_Chars[Characters: introduction_characters<br/>regular_contacts]
        H_Events[Events: welcome, first-steps]
        H_Thresh[Leave: 10+ puzzles OR 5+ books]
    end

    subgraph "Beat: first_plot_point"
        FPP_Music[Music: journey-begins]
        FPP_Chars[Characters: + essential_library_staff<br/>+ long_term_scholars]
        FPP_Events[Events: deeper-mysteries]
        FPP_Thresh[Leave: 25+ puzzles OR 10+ books]
    end

    subgraph "Beat: midpoint"
        M_Music[Music: turning-point]
        M_Chars[Characters: + extended_library_staff<br/>+ visiting_scholars]
        M_Events[Events: revelation, discovery]
        M_Thresh[Leave: 75+ puzzles OR 40+ books]
    end

    subgraph "Beat: climax"
        C_Music[Music: final-challenge]
        C_Chars[Characters: + visiting_dignitaries<br/>+ special_event_characters]
        C_Events[Events: confrontation, truth]
        C_Thresh[Leave: 200+ puzzles OR 100+ books]
    end

    H_Thresh --> FPP_Music
    FPP_Thresh --> M_Music
    M_Thresh --> C_Music

    H_Chars -->|Persist| FPP_Chars
    FPP_Chars -->|Persist| M_Chars
    M_Chars -->|Persist| C_Chars

    style H_Music fill:#e3f2fd
    style FPP_Music fill:#e3f2fd
    style M_Music fill:#e3f2fd
    style C_Music fill:#e3f2fd
```

## Persistence & State Management

```mermaid
graph TB
    subgraph "GameState Fields"
        GS_StoryProg[storyProgress: StoryProgressState<br/>Blurb tracking]
        GS_Dialogue[dialogue.completedStoryEvents<br/>Event tracking]
        GS_Metrics[completedPuzzles, completedBooks<br/>discoveredBooks]
    end

    subgraph "Save System"
        SaveOpt[optimizedSaveSystem]
        V2Format[V2 Optimized Format]
        LocalStor[(localStorage)]
    end

    subgraph "Load & Restore"
        LoadProg[loadProgress]
        Restore[restoreGameState]
        InitSPM[Initialize StoryProgressionManager]
        InitSBM[Initialize storyBlurbManager]
    end

    subgraph "Sync on Load"
        SyncBeat[Sync current story beat]
        SyncMusic[Resume correct music]
        SyncChars[Load character groups]
        SyncEvents[Check triggered events]
    end

    GS_StoryProg --> SaveOpt
    GS_Dialogue --> SaveOpt
    GS_Metrics --> SaveOpt

    SaveOpt --> V2Format
    V2Format --> LocalStor

    LocalStor --> LoadProg
    LoadProg --> Restore
    Restore --> InitSPM
    Restore --> InitSBM

    InitSPM --> SyncBeat
    SyncBeat --> SyncMusic
    SyncBeat --> SyncChars
    InitSBM --> SyncEvents

    style SaveOpt fill:#4CAF50,stroke:#2E7D32,color:#fff
    style V2Format fill:#2196F3,stroke:#1565C0,color:#fff
    style SyncBeat fill:#FF9800,stroke:#E65100,color:#fff
```

## Key Components Responsibilities

```mermaid
graph TB
    subgraph "StoryProgressionManager"
        SPM_Load[Load story-progression-config.json]
        SPM_Check[Check progression rules vs metrics]
        SPM_Advance[Advance story beat when thresholds met]
        SPM_Coord[Coordinate: music, events, characters]
        SPM_Emit[Emit beat change events]
    end

    subgraph "storyBlurbManager"
        SBM_Load[Load story-progress.json]
        SBM_Index[Index blurbs by trigger]
        SBM_Check[Check trigger conditions vs state]
        SBM_Unlock[Unlock matching blurbs]
        SBM_Track[Track fired triggers]
    end

    subgraph "StoryEventTriggerChecker"
        SETC_Index[Index events by story beat]
        SETC_Filter[Filter events for current beat]
        SETC_Match[Match trigger patterns with regex]
        SETC_Optimize[Optimize: check 5-10 not 50]
    end

    subgraph "StoryEventPlayer"
        SEP_Load[Load event from DialogueManager]
        SEP_Seq[Sequence dialogue entries]
        SEP_Chunk[Chunk text for display]
        SEP_Resolve[Resolve character data]
        SEP_Preload[Preload portraits]
    end

    subgraph "DialogueManager"
        DM_LoadChars[Load character groups]
        DM_LoadEvents[Load story events]
        DM_Store[Store character & event data]
        DM_Provide[Provide to other systems]
        DM_Beat[Track current story beat]
    end

    style SPM_Coord fill:#4CAF50,stroke:#2E7D32,color:#fff
    style SBM_Unlock fill:#2196F3,stroke:#1565C0,color:#fff
    style SETC_Optimize fill:#FF9800,stroke:#E65100,color:#fff
    style SEP_Seq fill:#9C27B0,stroke:#6A1B9A,color:#fff
    style DM_Store fill:#673AB7,stroke:#4527A0,color:#fff
```

## Testing Considerations

Key areas to test when modifying the story progression system:

1. **Story Beat Progression**
   - Rules trigger at correct thresholds
   - Music changes on beat transition
   - Characters load for correct beats
   - Beat persists across save/load

2. **Story Blurb System**
   - Triggers fire on milestone achievements
   - No duplicate blurbs unlocked
   - Blurbs respect story beat restrictions
   - Fired triggers persist in saves

3. **Story Event System**
   - Events trigger on correct conditions
   - Event index filters correctly
   - Multi-character dialogue sequences work
   - Completed events persist

4. **Integration**
   - Puzzle completion triggers all systems
   - State transitions detected correctly
   - No race conditions on rapid progression
   - Systems don't interfere with each other

5. **Performance**
   - Event checking stays fast (<10ms)
   - Music doesn't restart unnecessarily
   - Characters don't reload on each check
   - Index builds only once

6. **Data Integrity**
   - Config files validate correctly
   - Missing events fail gracefully
   - Character references resolve
   - Story beat order maintained

## Performance Characteristics

- **Story Beat Check**: ~1-5ms (rule evaluation)
- **Blurb Trigger Check**: ~2-10ms (condition matching)
- **Event Trigger Check**: ~1-5ms with indexing (was ~10-50ms)
- **Event Playback**: ~5-20ms per dialogue entry
- **Character Loading**: ~50-200ms per group
- **Music Transition**: ~2000ms fade duration

## Future Considerations

1. **Dynamic Story Branching**: Player choices affect beat progression
2. **Parallel Story Threads**: Multiple storylines tracked simultaneously
3. **Conditional Events**: Events that require multiple conditions
4. **Story Replay**: Rewatch completed events from library
5. **Achievement Tracking**: Story-based achievements and milestones
6. **Analytics**: Track player progression patterns
7. **Localization**: Multi-language story content
8. **Voice Acting**: Audio dialogue for story events
9. **Cutscenes**: Visual accompaniment for major events
10. **Story Editor**: Tools for creating/editing story content
