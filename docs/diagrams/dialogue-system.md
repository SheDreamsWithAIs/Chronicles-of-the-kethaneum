# Dialogue System Architecture Diagram

## Overview
The Chronicles of the Kethaneum dialogue system manages two distinct types of dialogue: **Banter** (random character interactions) and **Story Events** (scripted multi-character sequences). The system provides character loading, smart text chunking, and adaptive UI rendering.

## Main Architecture

```mermaid
graph TB
    subgraph "Core Manager"
        DM[DialogueManager<br/>Central Controller]
        Config[dialogue-config.json<br/>System Configuration]
    end

    subgraph "Character System (Banter)"
        CharData[Character Data<br/>JSON files]
        CharManifest[character-manifest.json<br/>File listing]
        LoadGroups[Loading Groups<br/>By story beat]
        BanterLogic[Banter Selection<br/>Weighted random]
    end

    subgraph "Story Event System"
        EventData[Story Events<br/>JSON files]
        EventManifest[event-manifest.json<br/>File listing]
        SETC[StoryEventTriggerChecker<br/>Condition checking]
        SEP[StoryEventPlayer<br/>Sequence playback]
    end

    subgraph "Text Processing"
        ChunkText[chunkText<br/>Smart text splitting]
        DeviceDetect[Device Detection<br/>Mobile/Tablet/Desktop]
    end

    subgraph "UI Components"
        DialogueQ[DialogueQueue<br/>Panel manager]
        DialogueP[DialoguePanel<br/>Individual panels]
        Controls[DialogueControls<br/>Continue button]
    end

    subgraph "React Integration"
        UseDialogue[useDialogue hook<br/>Banter integration]
        UseGameState[useGameState hook<br/>Event integration]
    end

    subgraph "Game State"
        GameState[GameState<br/>dialogue.completedStoryEvents]
    end

    Config --> DM
    CharManifest --> DM
    CharData --> DM
    EventManifest --> DM
    EventData --> DM

    DM --> LoadGroups
    DM --> BanterLogic
    DM --> SETC
    DM --> SEP

    SEP --> ChunkText
    BanterLogic --> ChunkText

    ChunkText --> DeviceDetect

    ChunkText --> DialogueQ
    DialogueQ --> DialogueP
    Controls --> DialogueQ

    UseDialogue --> DM
    UseGameState --> DM
    UseGameState --> SETC

    DM --> GameState
    SETC --> GameState

    style DM fill:#4CAF50,stroke:#2E7D32,color:#fff
    style BanterLogic fill:#2196F3,stroke:#1565C0,color:#fff
    style SETC fill:#FF9800,stroke:#E65100,color:#fff
    style SEP fill:#9C27B0,stroke:#6A1B9A,color:#fff
    style DialogueQ fill:#673AB7,stroke:#4527A0,color:#fff
```

## Character Loading & Management

```mermaid
stateDiagram-v2
    [*] --> Initialize: DialogueManager.initialize()

    Initialize --> LoadConfig: Load dialogue-config.json
    LoadConfig --> LoadManifest: Load character-manifest.json
    LoadManifest --> LoadIntroChars: Load introduction_characters

    LoadIntroChars --> Ready: System Ready

    Ready --> LoadGroup: Story beat advances
    LoadGroup --> CheckRetirement: Load new character group

    CheckRetirement --> UpdateAvailable: Check character retirements
    UpdateAvailable --> Ready: Characters updated

    Ready --> GetBanter: User requests banter
    GetBanter --> FilterByBeat: Filter dialogue by story beat
    FilterByBeat --> WeightedSelect: Weighted random selection
    WeightedSelect --> ReturnBanter: Return dialogue
    ReturnBanter --> Ready

    note right of FilterByBeat
        Filters dialogue entries:
        - availableFrom <= currentBeat
        - availableUntil >= currentBeat
        - Character group loaded
    end note

    note right of WeightedSelect
        Weight = 3 for new characters
        Weight = 1 for recent (within window)
        Prevents repetition
    end note
```

## Banter System Flow

```mermaid
sequenceDiagram
    participant UI
    participant Hook as useDialogue
    participant DM as DialogueManager
    participant Filter as Beat Filter
    participant Selector as Weighted Selector
    participant GameState

    UI->>Hook: getRandomBanter(storyBeat)
    activate Hook

    Hook->>DM: getRandomBanter(storyBeat)
    activate DM

    DM->>DM: Get current story beat
    DM->>Filter: getAvailableCharacters(beat)
    activate Filter

    Note over Filter: Iterate loaded characters

    Filter->>Filter: Check loading group loaded
    Filter->>Filter: filterDialogueByStoryBeat()
    Filter->>Filter: Check availableFrom/Until

    Filter-->>DM: Available characters list
    deactivate Filter

    DM->>Selector: selectCharacterWeighted()
    activate Selector

    Selector->>Selector: Check recently used
    Selector->>Selector: Apply weights (3:1)
    Selector->>Selector: Random selection

    Selector-->>DM: Selected character
    deactivate Selector

    DM->>DM: Random dialogue selection
    DM->>DM: Add to recently used

    DM-->>Hook: BanterResult
    deactivate DM

    Hook-->>UI: Display dialogue
    deactivate Hook
```

## Story Event System Flow

```mermaid
sequenceDiagram
    participant Game as Game Logic
    participant SETC as StoryEventTriggerChecker
    participant DM as DialogueManager
    participant SEP as StoryEventPlayer
    participant Queue as DialogueQueue
    participant Panel as DialoguePanel
    participant GameState

    Game->>GameState: Puzzle complete<br/>Update metrics
    GameState->>SETC: checkAvailableEvents(state)
    activate SETC

    SETC->>SETC: Get current story beat
    SETC->>SETC: Get events for beat (indexed)
    SETC->>SETC: Match trigger patterns

    alt Event trigger matched
        SETC-->>GameState: [eventId]
        GameState->>Game: Event available
        Game->>DM: getStoryEvent(eventId)
        DM-->>Game: StoryEvent data

        Game->>SEP: loadStoryEvent(eventId)
        activate SEP
        SEP->>DM: Get full character data
        SEP->>SEP: Validate event ID
        SEP-->>Game: Event loaded

        Game->>SEP: start()
        SEP->>SEP: next()
        SEP->>SEP: Get dialogue entry
        SEP->>DM: getCharacterById()
        DM-->>SEP: CharacterData
        SEP->>SEP: chunkText(dialogue.text)
        SEP->>SEP: Build DialogueEntry

        SEP-->>Queue: emit DialogueEntry
        deactivate SEP

        Queue->>Queue: addDialogue()
        Queue->>Panel: Render panel
        Panel-->>Game: Display dialogue

        Game->>Queue: handleContinue()
        Queue->>Queue: Check chunks remaining

        alt More chunks
            Queue->>Panel: Update to next chunk
        else No more chunks
            Queue->>SEP: advance()
            SEP->>SEP: next()
            Note over SEP: Repeat until sequence complete
        end

        SEP->>Game: onComplete()
        Game->>GameState: Mark event completed
        GameState->>GameState: Save progress
    end

    deactivate SETC
```

## Character Data Structure

```mermaid
graph TB
    subgraph "Character JSON File"
        CharFile[character.json]
        CharDef[character:<br/>id, name, title, description]
        Portrait[portraitFile]
        Group[loadingGroup]
        Retire[retireAfter]
        Specialties[specialties: string[]]
        BanterArr[banterDialogue: array]
        Metadata[metadata]
    end

    subgraph "Banter Dialogue Entry"
        BanterEntry[BanterDialogue]
        B_ID[id: unique string]
        B_Text[text: dialogue content]
        B_Emotion[emotion: Emotion[]]
        B_Category[category: DialogueCategory]
        B_From[availableFrom: StoryBeat]
        B_Until[availableUntil?: StoryBeat]
    end

    subgraph "Loading Groups"
        IntroGroup[introduction_characters<br/>hook]
        RegGroup[regular_contacts<br/>hook]
        EssGroup[essential_library_staff<br/>first_plot_point]
        ExtGroup[extended_library_staff<br/>midpoint]
        LongGroup[long_term_scholars<br/>first_plot_point]
        VisitGroup[visiting_scholars<br/>midpoint]
        DignGroup[visiting_dignitaries<br/>climax]
    end

    CharFile --> CharDef
    CharFile --> Portrait
    CharFile --> Group
    CharFile --> Retire
    CharFile --> Specialties
    CharFile --> BanterArr
    CharFile --> Metadata

    BanterArr --> BanterEntry
    BanterEntry --> B_ID
    BanterEntry --> B_Text
    BanterEntry --> B_Emotion
    BanterEntry --> B_Category
    BanterEntry --> B_From
    BanterEntry --> B_Until

    Group --> IntroGroup
    Group --> RegGroup
    Group --> EssGroup
    Group --> ExtGroup
    Group --> LongGroup
    Group --> VisitGroup
    Group --> DignGroup

    style CharFile fill:#fff3e0
    style BanterEntry fill:#e3f2fd
    style IntroGroup fill:#c8e6c9
```

## Story Event Data Structure

```mermaid
graph TB
    subgraph "Story Event JSON File"
        EventFile[event.json]
        EventInfo[storyEvent:<br/>id, title, triggerCondition, storyBeat]
        DialogueArr[dialogue: array]
        CharsArr[characters: array]
        MetaData[metadata:<br/>duration, importance, unlocks]
    end

    subgraph "Dialogue Sequence Entry"
        DialogueEntry[StoryEventDialogue]
        D_Seq[sequence: number]
        D_Speaker[speaker: characterId]
        D_Text[text: dialogue content]
        D_Emotion[emotion: Emotion[]]
        D_Pause[pauseAfter: boolean]
        D_Last[isLastInSequence?: boolean]
    end

    subgraph "Character Reference"
        CharRef[StoryEventCharacter]
        CR_ID[id: characterId]
        CR_Portrait[portraitFile: override]
    end

    subgraph "Trigger Patterns"
        T1[first-puzzle-complete]
        T2[puzzle-milestone-N]
        T3[first-kethaneum-puzzle-complete]
        T4[kethaneum-puzzle-milestone-N]
        T5[first-book-complete]
        T6[books-complete-N]
        T7[kethaneum-book-complete-title]
        T8[player-enters-library-first-time]
    end

    EventFile --> EventInfo
    EventFile --> DialogueArr
    EventFile --> CharsArr
    EventFile --> MetaData

    DialogueArr --> DialogueEntry
    DialogueEntry --> D_Seq
    DialogueEntry --> D_Speaker
    DialogueEntry --> D_Text
    DialogueEntry --> D_Emotion
    DialogueEntry --> D_Pause
    DialogueEntry --> D_Last

    CharsArr --> CharRef
    CharRef --> CR_ID
    CharRef --> CR_Portrait

    EventInfo --> T1
    EventInfo --> T2
    EventInfo --> T3
    EventInfo --> T4
    EventInfo --> T5
    EventInfo --> T6
    EventInfo --> T7
    EventInfo --> T8

    style EventFile fill:#fff3e0
    style DialogueEntry fill:#e3f2fd
    style CharRef fill:#c8e6c9
```

## Text Chunking System

```mermaid
graph TB
    subgraph "Input"
        FullText[Full Dialogue Text<br/>Could be very long]
    end

    subgraph "Device Detection"
        DetectDevice{Detect Device Type}
        Mobile[Mobile<br/>maxChars: 120]
        Tablet[Tablet<br/>maxChars: 200]
        Desktop[Desktop<br/>maxChars: 300]
    end

    subgraph "Chunking Logic"
        CheckLength{Text > maxChars?}
        SplitSentences[Split into sentences<br/>Regex: /[^.!?]+[.!?]+/g]
        BuildChunks[Build chunks iteratively]
        CheckSentence{Sentence fits?}
        AddSentence[Add to current chunk]
        SplitWords[Split sentence by words]
        BuildWordChunks[Build word chunks]
    end

    subgraph "Output"
        SingleChunk[Return [text]]
        MultipleChunks[Return chunks array]
    end

    subgraph "Error Handling"
        ValidateInput{Valid input?}
        GetConfig{Config loaded?}
        Fallback[Return [text]<br/>Single chunk fallback]
    end

    FullText --> ValidateInput
    ValidateInput -->|No| Fallback
    ValidateInput -->|Yes| GetConfig
    GetConfig -->|No| Fallback
    GetConfig -->|Yes| DetectDevice

    DetectDevice --> Mobile
    DetectDevice --> Tablet
    DetectDevice --> Desktop

    Mobile --> CheckLength
    Tablet --> CheckLength
    Desktop --> CheckLength

    CheckLength -->|No| SingleChunk
    CheckLength -->|Yes| SplitSentences

    SplitSentences --> BuildChunks
    BuildChunks --> CheckSentence
    CheckSentence -->|Yes| AddSentence
    CheckSentence -->|No, chunk full| BuildChunks
    CheckSentence -->|No, sentence too long| SplitWords

    SplitWords --> BuildWordChunks
    BuildWordChunks --> BuildChunks

    AddSentence --> CheckSentence
    BuildChunks --> MultipleChunks

    style Fallback fill:#ffcdd2
    style SingleChunk fill:#c8e6c9
    style MultipleChunks fill:#c8e6c9
```

## Dialogue Queue UI System

```mermaid
graph TB
    subgraph "DialogueQueue Component"
        QueueState[Queue State<br/>DialogueEntry[]]
        AnimStates[Animation States<br/>Map<id, state>]
        TransitionLock[Transition Lock<br/>Prevents race conditions]
        PendingDialogue[Pending Dialogue<br/>Buffer for queued adds]
    end

    subgraph "Animation States"
        Entering[entering<br/>Panel sliding in]
        Active[active<br/>Panel visible]
        Shifting[shifting<br/>Panel moving up]
        Exiting[exiting<br/>Panel sliding out]
    end

    subgraph "Panel Positions"
        TopPanel[Top Panel<br/>Older dialogue]
        BottomPanel[Bottom Panel<br/>Current dialogue]
    end

    subgraph "Add Dialogue Flow"
        AddRequest[addDialogue(entry)]
        CheckLock{Transition<br/>in progress?}
        QueuePending[Queue in pending buffer]
        CheckCount{Queue<br/>length?}
        Empty[0: First panel]
        One[1: Shift existing]
        Two[2+: Remove top, shift, add]
    end

    subgraph "Continue Flow"
        ContinueReq[handleContinue()]
        CheckChunks{More chunks?}
        NextChunk[Show next chunk]
        AdvanceSeq[Call onContinue()<br/>Advance sequence]
    end

    QueueState --> AnimStates
    AnimStates --> Entering
    AnimStates --> Active
    AnimStates --> Shifting
    AnimStates --> Exiting

    QueueState --> TopPanel
    QueueState --> BottomPanel

    AddRequest --> CheckLock
    CheckLock -->|Yes| QueuePending
    CheckLock -->|No| CheckCount
    CheckCount -->|0| Empty
    CheckCount -->|1| One
    CheckCount -->|2+| Two

    Empty --> Entering
    One --> Shifting
    Two --> Exiting

    ContinueReq --> CheckChunks
    CheckChunks -->|Yes| NextChunk
    CheckChunks -->|No| AdvanceSeq

    style TransitionLock fill:#FF9800,stroke:#E65100,color:#fff
    style Active fill:#c8e6c9
    style Entering fill:#e3f2fd
    style Shifting fill:#fff9c4
    style Exiting fill:#ffcdd2
```

## Dialogue Panel Animation

```mermaid
sequenceDiagram
    participant Queue as DialogueQueue
    participant Panel1 as Panel (Top)
    participant Panel2 as Panel (Bottom)
    participant NewPanel as Panel (New)

    Note over Queue: Queue has 2 panels

    Queue->>Queue: addDialogue(new entry)
    Queue->>Panel1: Set state = 'exiting'
    Note over Panel1: Slides out (opacity + transform)

    Queue->>Panel2: Set state = 'shifting'
    Note over Panel2: Fades slightly

    Queue->>Queue: Wait stagger delay (100ms)

    Queue->>Queue: Update queue array<br/>[Panel2, NewPanel]
    Note over Panel1: Removed from DOM<br/>(flexbox repositions)

    Queue->>NewPanel: Set state = 'entering'
    Note over Panel2: Now in top position<br/>(flexbox natural flow)
    Note over NewPanel: Slides in from bottom

    Queue->>Queue: Wait animation complete (500ms)

    Queue->>Panel2: Set state = 'active'
    Queue->>NewPanel: Set state = 'active'
    Note over Panel2,NewPanel: Animations complete
```

## Weighted Character Selection

```mermaid
graph TB
    subgraph "Available Characters"
        Char1[Character A<br/>Recently used]
        Char2[Character B<br/>Not recent]
        Char3[Character C<br/>Not recent]
    end

    subgraph "Weighting Process"
        CheckRecent{Check Recently<br/>Used List}
        Weight1[Weight = 1<br/>Recently used]
        Weight3[Weight = 3<br/>Not recently used]
    end

    subgraph "Weighted Pool"
        Pool[Weighted Selection Pool]
        Entry1A[Character A]
        Entry2A[Character B]
        Entry2B[Character B]
        Entry2C[Character B]
        Entry3A[Character C]
        Entry3B[Character C]
        Entry3C[Character C]
    end

    subgraph "Selection"
        Random[Random Selection<br/>from Pool]
        Selected[Selected Character]
    end

    subgraph "Post-Selection"
        AddRecent[Add to Recently Used]
        Window{Window size<br/>exceeded?}
        Remove[Remove oldest]
    end

    Char1 --> CheckRecent
    Char2 --> CheckRecent
    Char3 --> CheckRecent

    CheckRecent -->|Yes| Weight1
    CheckRecent -->|No| Weight3

    Weight1 --> Entry1A
    Weight3 --> Entry2A
    Weight3 --> Entry2B
    Weight3 --> Entry2C
    Weight3 --> Entry3A
    Weight3 --> Entry3B
    Weight3 --> Entry3C

    Entry1A --> Pool
    Entry2A --> Pool
    Entry2B --> Pool
    Entry2C --> Pool
    Entry3A --> Pool
    Entry3B --> Pool
    Entry3C --> Pool

    Pool --> Random
    Random --> Selected

    Selected --> AddRecent
    AddRecent --> Window
    Window -->|Yes| Remove
    Window -->|No| AddRecent

    style Weight3 fill:#c8e6c9
    style Weight1 fill:#ffcdd2
    style Selected fill:#4CAF50,stroke:#2E7D32,color:#fff
```

## Event Trigger Index System

```mermaid
graph TB
    subgraph "Event Loading"
        LoadEvents[Load all story events<br/>~50 events total]
        BuildIndex[Build EventIndex]
    end

    subgraph "Index Structure"
        ByBeat[Index by Story Beat<br/>Map<StoryBeat, Event[]>]
        ByPattern[Index by Pattern Type<br/>Map<PatternType, Event[]>]
    end

    subgraph "Story Beat Bins"
        Hook[hook: ~8 events]
        FPP[first_plot_point: ~6 events]
        Midpoint[midpoint: ~10 events]
        Climax[climax: ~7 events]
        Any[any beat: ~5 events]
    end

    subgraph "Checking Process"
        CheckReq[checkAvailableEvents(state)]
        GetBeat[Get current story beat]
        FilterByBeat[Get events for beat only]
        MatchPatterns[Match trigger patterns]
        ReturnMatched[Return matched event IDs]
    end

    subgraph "Performance"
        Before[❌ Before: Check 50 events]
        After[✅ After: Check 5-10 events]
        Speedup[5-10x faster]
    end

    LoadEvents --> BuildIndex
    BuildIndex --> ByBeat
    BuildIndex --> ByPattern

    ByBeat --> Hook
    ByBeat --> FPP
    ByBeat --> Midpoint
    ByBeat --> Climax
    ByBeat --> Any

    CheckReq --> GetBeat
    GetBeat --> FilterByBeat
    FilterByBeat --> Hook
    FilterByBeat --> Any
    Hook --> MatchPatterns
    Any --> MatchPatterns
    MatchPatterns --> ReturnMatched

    Before -.->|Optimization| After
    After --> Speedup

    style BuildIndex fill:#4CAF50,stroke:#2E7D32,color:#fff
    style FilterByBeat fill:#2196F3,stroke:#1565C0,color:#fff
    style After fill:#c8e6c9
    style Before fill:#ffcdd2
    style Speedup fill:#4CAF50,stroke:#2E7D32,color:#fff
```

## Integration Points

```mermaid
graph TB
    subgraph "Game Logic Integration"
        PuzzleComplete[Puzzle Completion]
        BookDiscovery[Book Discovery]
        BeatAdvance[Story Beat Advance]
    end

    subgraph "Dialogue Manager"
        DM[DialogueManager]
        SetBeat[setStoryBeat()]
        GetBanter[getRandomBanter()]
        GetEvent[getStoryEvent()]
    end

    subgraph "UI Integration"
        Library[Library Page<br/>Random banter display]
        EventTrigger[Event Trigger UI<br/>Full-screen overlay]
        BookPassage[Book of Passage<br/>Story blurbs]
    end

    subgraph "State Management"
        GameState[GameState]
        CompEvents[dialogue.completedStoryEvents]
        VisitedLib[dialogue.hasVisitedLibrary]
    end

    subgraph "Save System"
        SaveSys[Save System]
        Persist[Persist dialogue state]
    end

    PuzzleComplete --> DM
    BookDiscovery --> DM
    BeatAdvance --> SetBeat

    DM --> GetBanter
    DM --> GetEvent

    GetBanter --> Library
    GetEvent --> EventTrigger

    DM --> GameState
    GameState --> CompEvents
    GameState --> VisitedLib

    CompEvents --> SaveSys
    VisitedLib --> SaveSys
    SaveSys --> Persist

    style DM fill:#4CAF50,stroke:#2E7D32,color:#fff
    style GameState fill:#F44336,stroke:#C62828,color:#fff
    style SaveSys fill:#2196F3,stroke:#1565C0,color:#fff
```

## Configuration System

```mermaid
graph TB
    subgraph "dialogue-config.json"
        ConfigFile[Configuration File]
        System[system:<br/>version, logging, fallback]
        Paths[paths:<br/>directories]
        Display[display:<br/>textLimits, animations]
        Structure[storyStructure:<br/>beats, retirement]
        Behavior[behavior:<br/>selection, events, errors]
    end

    subgraph "Text Limits"
        Mobile[mobile: 120 chars, 20 words]
        Tablet[tablet: 200 chars, 35 words]
        Desktop[desktop: 300 chars, 50 words]
    end

    subgraph "Animation Settings"
        RevealSpeed[textRevealSpeed: medium]
        PanelTrans[panelTransitionDuration: 500ms]
        PortraitFade[characterPortraitFadeTime: 300ms]
    end

    subgraph "Banter Selection"
        Method[method: random/sequential/weighted]
        AvoidRepeats[avoidRepeats: true]
        ResetAll[resetAfterAllSeen: true]
        AvoidWindow[recentAvoidanceWindow: 3]
    end

    subgraph "Error Handling"
        MissingChar[missingCharacterAction: useDefault]
        MissingStory[missingStoryAction: skipGracefully]
        CorruptFile[corruptFileAction: logAndContinue]
    end

    ConfigFile --> System
    ConfigFile --> Paths
    ConfigFile --> Display
    ConfigFile --> Structure
    ConfigFile --> Behavior

    Display --> Mobile
    Display --> Tablet
    Display --> Desktop
    Display --> RevealSpeed
    Display --> PanelTrans
    Display --> PortraitFade

    Behavior --> Method
    Behavior --> AvoidRepeats
    Behavior --> ResetAll
    Behavior --> AvoidWindow
    Behavior --> MissingChar
    Behavior --> MissingStory
    Behavior --> CorruptFile

    style ConfigFile fill:#fff3e0
    style Display fill:#e3f2fd
    style Behavior fill:#c8e6c9
```

## File Structure & Manifests

```mermaid
graph TB
    subgraph "Data Files"
        ConfigJSON[/data/dialogue-config.json<br/>System configuration]
        CharManifest[/data/characters/character-manifest.json<br/>List of character files]
        EventManifest[/data/story-events/event-manifest.json<br/>List of event files]
        CharFiles[/data/characters/*.json<br/>Character definitions + banter]
        EventFiles[/data/story-events/*.json<br/>Story event sequences]
    end

    subgraph "Core System"
        DM[lib/dialogue/DialogueManager.ts<br/>Central controller]
        SETC[lib/dialogue/StoryEventTriggerChecker.ts<br/>Trigger condition checker]
        SEP[lib/dialogue/StoryEventPlayer.ts<br/>Sequence player]
        ChunkText[lib/dialogue/chunkText.ts<br/>Text chunking utility]
        Types[lib/dialogue/types.ts<br/>TypeScript definitions]
    end

    subgraph "UI Components"
        DialogueQ[components/dialogue/DialogueQueue.tsx<br/>Panel queue manager]
        DialogueP[components/dialogue/DialoguePanel.tsx<br/>Individual panel]
        Controls[components/dialogue/DialogueControls.tsx<br/>Continue button]
    end

    subgraph "React Hooks"
        UseDialogue[hooks/dialogue/useDialogue.ts<br/>Banter integration]
    end

    subgraph "Integration"
        Library[app/library/page.tsx<br/>Banter display]
        EventUI[Story event trigger UI<br/>Full-screen overlay]
    end

    ConfigJSON --> DM
    CharManifest --> DM
    EventManifest --> DM
    CharFiles --> DM
    EventFiles --> DM

    DM --> SETC
    DM --> SEP
    SEP --> ChunkText

    DM --> Types
    SETC --> Types
    SEP --> Types

    DM --> UseDialogue
    UseDialogue --> Library

    SETC --> EventUI
    SEP --> DialogueQ
    DialogueQ --> DialogueP
    DialogueQ --> Controls

    style ConfigJSON fill:#fff3e0
    style CharFiles fill:#fff3e0
    style EventFiles fill:#fff3e0
    style DM fill:#4CAF50,stroke:#2E7D32,color:#fff
    style SETC fill:#FF9800,stroke:#E65100,color:#fff
    style SEP fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

## Dialogue Types & Emotions

```mermaid
graph LR
    subgraph "Emotion Types (26 total)"
        E1[warm, professional, encouraging]
        E2[proud, explanatory, mystical]
        E3[conspiratorial, reassuring, grateful]
        E4[scholarly, verbose, enthusiastic]
        E5[analytical, professorial, impressed]
        E6[instructional, methodical, passionate]
        E7[contemplative, collaborative, intellectual]
        E8[scientific, excited, theoretical]
        E9[apologetic, self-aware, amused]
        E10[curious, satisfied, welcoming, formal, wise]
    end

    subgraph "Dialogue Categories"
        C1[general-welcome]
        C2[progress-praise]
        C3[lore-sharing]
        C4[casual-advice]
        C5[appreciation]
        C6[academic-introduction]
        C7[lore-exposition]
        C8[academic-guidance]
        C9[colleague-reference]
        C10[research-exposition]
        C11[meta-humor]
    end

    subgraph "Screen Types"
        S1[library: Banter display]
        S2[tutorial: Guidance]
        S3[testing: Debug]
        S4[puzzle: Hints]
    end

    subgraph "Relationship Types"
        R1[mentor-colleague]
        R2[academic-mentor]
        R3[testing-assistant]
        R4[colleague]
        R5[supervisor]
    end

    E1 --> C1
    E2 --> C2
    E3 --> C3
    E4 --> C6
    E5 --> C7
    E6 --> C8
    E7 --> C9
    E8 --> C10
    E9 --> C11

    C1 --> S1
    C2 --> S1
    C3 --> S1
    C6 --> S2
    C8 --> S4

    S1 --> R1
    S2 --> R2
    S4 --> R3

    style E1 fill:#e3f2fd
    style C1 fill:#c8e6c9
    style S1 fill:#fff9c4
    style R1 fill:#ffebee
```

## Error Handling & Fallbacks

```mermaid
flowchart TD
    Start[Operation Request]

    Start --> ValidateState{System<br/>initialized?}
    ValidateState -->|No| ErrorNotInit[Error: Not initialized]
    ValidateState -->|Yes| LoadConfig{Config<br/>loaded?}

    LoadConfig -->|No| UseFallback[Use fallback config]
    LoadConfig -->|Yes| Proceed[Proceed with operation]

    UseFallback --> Proceed

    Proceed --> Operation{Operation<br/>Type?}

    Operation -->|Load Character| TryLoadChar[Try load character file]
    Operation -->|Load Event| TryLoadEvent[Try load event file]
    Operation -->|Get Banter| TryGetBanter[Try get banter]

    TryLoadChar --> CharSuccess{Success?}
    CharSuccess -->|Yes| StoreChar[Store character data]
    CharSuccess -->|No| LogCharError[Log error, continue]

    TryLoadEvent --> EventSuccess{Success?}
    EventSuccess -->|Yes| StoreEvent[Store event data]
    EventSuccess -->|No| LogEventError[Log error, continue]

    TryGetBanter --> BanterSuccess{Characters<br/>available?}
    BanterSuccess -->|Yes| ReturnBanter[Return banter]
    BanterSuccess -->|No| BanterError[Error: No characters]

    StoreChar --> Success[Success]
    StoreEvent --> Success
    ReturnBanter --> Success
    LogCharError --> Success
    LogEventError --> Success
    BanterError --> Fail[Fail gracefully]
    ErrorNotInit --> Fail

    style UseFallback fill:#fff9c4
    style LogCharError fill:#fff9c4
    style LogEventError fill:#fff9c4
    style Success fill:#c8e6c9
    style Fail fill:#ffcdd2
```

## Performance Characteristics

- **Banter Selection**: ~1-5ms (character filtering + weighted selection)
- **Event Trigger Check**: ~1-5ms with indexing (was ~10-50ms before optimization)
- **Event Sequence Load**: ~5-20ms (character data resolution)
- **Text Chunking**: ~1-10ms (depends on text length and device)
- **Panel Animation**: 500ms enter/exit, 100ms stagger
- **Character Group Loading**: ~50-200ms (depends on number of files)

## Testing Considerations

Key areas to test when modifying the dialogue system:

1. **Character Loading**
   - Groups load at correct story beats
   - Character data validates correctly
   - Manifest parsing handles missing files
   - Portrait loading with fallbacks

2. **Banter System**
   - Story beat filtering works correctly
   - Weighted selection avoids repetition
   - Recently used tracking functions
   - Empty/no characters handled gracefully

3. **Story Event System**
   - Trigger patterns match correctly
   - Event index filters by beat
   - Multi-character sequences play in order
   - Character data resolves properly
   - Completed events persist

4. **Text Chunking**
   - Device detection accurate
   - Chunks respect char limits
   - Sentence boundaries preserved
   - Word boundaries fallback works
   - Edge cases (empty, very long) handled

5. **UI Components**
   - Queue animations smooth
   - Panel transitions don't overlap
   - Chunk indicators display correctly
   - Continue button advances properly
   - Empty queue closes cleanly

6. **Integration**
   - Dialogue state persists in saves
   - Story beat changes reflect immediately
   - Event completion tracking works
   - Library visited flag sets correctly

## Future Considerations

1. **Voice Acting**: Audio dialogue for story events
2. **Dialogue History**: Replay previous conversations
3. **Character Portraits**: Emotion-based portrait variants
4. **Localization**: Multi-language dialogue support
5. **Dynamic Banter**: Context-aware dialogue based on recent actions
6. **Seasonal Content**: Time-based special dialogue
7. **Achievement Dialogue**: Special banter for milestone achievements
8. **Tutorial System**: Integrated guidance dialogue
9. **Accessibility**: Text-to-speech for dialogue
10. **Analytics**: Track most popular characters/dialogue
