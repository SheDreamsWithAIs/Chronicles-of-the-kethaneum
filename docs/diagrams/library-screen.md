# Library Screen Architecture Diagram

## Overview
The Library Screen is the central hub in Chronicles of the Kethaneum. It provides access to **puzzle selection** (Browse Archives), **character dialogues** (Start Conversation with story events and banter), **story progress** (Book of Passage), and **game settings**. The screen intelligently routes between story events and random banter, manages conversation state, and provides visual notifications for new content.

## Main Architecture

```mermaid
graph TB
    subgraph "UI Component"
        LibraryPage[app/library/page.tsx<br/>Main Screen Component]
        Actions[Five Action Buttons]
        Browse[Browse Archives<br/>→ Genre Selection]
        Conversation[Start Conversation<br/>→ Story Event or Banter]
        BookPass[Book of Passage<br/>→ Story progress]
        MainMenu[Main Menu<br/>→ Title screen]
        Settings[Settings<br/>→ Settings modal]
    end

    subgraph "Modal Components"
        GenreModal[GenreSelectionModal<br/>Genre cards display]
        SettingsModal[SettingsMenu<br/>Audio, difficulty, etc.]
    end

    subgraph "Dialogue System"
        DialogueQueue[DialogueQueue<br/>Panel manager]
        DialogueControls[DialogueControls<br/>Continue button]
        DialogueMgr[DialogueManager<br/>Character & event manager]
        EventPlayer[StoryEventPlayer<br/>Sequence orchestrator]
        EventChecker[StoryEventTriggerChecker<br/>Check available events]
    end

    subgraph "React Hooks"
        UseGameState[useGameState<br/>Game state management]
        UsePuzzle[usePuzzle<br/>Puzzle loading]
        UseDialogue[useDialogue<br/>Dialogue initialization]
        UsePageLoader[usePageLoader<br/>Loading states]
        UseStoryNotif[useStoryNotification<br/>New content alerts]
    end

    subgraph "Puzzle System"
        PuzzleSelector[puzzleSelector<br/>Genre selection logic]
        PuzzleLoader[puzzleLoader<br/>Load all puzzles]
    end

    subgraph "Notification System"
        NotifContext[StoryNotificationContext<br/>hasNewDialogue flag]
        ConversationBtn[Start Conversation Button<br/>Visual notification glow]
    end

    subgraph "State Management"
        GS_Dialogue[dialogue.completedStoryEvents<br/>dialogue.hasVisitedLibrary]
        GS_Genre[selectedGenre, currentGenre<br/>Puzzle selection state]
        GS_Puzzles[puzzles: {[genre]: PuzzleData[]}]
        GS_Story[storyProgress.currentStoryBeat]
    end

    LibraryPage --> Actions
    Actions --> Browse
    Actions --> Conversation
    Actions --> BookPass
    Actions --> MainMenu
    Actions --> Settings

    Browse --> GenreModal
    Settings --> SettingsModal
    Conversation --> DialogueQueue
    Conversation --> DialogueControls
    Conversation --> EventPlayer
    Conversation --> DialogueMgr

    LibraryPage --> UseGameState
    LibraryPage --> UsePuzzle
    LibraryPage --> UseDialogue
    LibraryPage --> UsePageLoader
    LibraryPage --> UseStoryNotif

    UseGameState --> GS_Dialogue
    UseGameState --> GS_Genre
    UseGameState --> GS_Puzzles
    UseGameState --> GS_Story

    GenreModal --> PuzzleSelector
    UsePuzzle --> PuzzleLoader

    EventPlayer --> EventChecker
    DialogueMgr --> EventChecker

    UseStoryNotif --> NotifContext
    NotifContext --> ConversationBtn

    style LibraryPage fill:#4CAF50,stroke:#2E7D32,color:#fff
    style DialogueMgr fill:#2196F3,stroke:#1565C0,color:#fff
    style EventPlayer fill:#FF9800,stroke:#E65100,color:#fff
    style GenreModal fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

## Five Main Actions

```mermaid
graph TB
    subgraph "Library Screen Actions"
        Center[Library Screen<br/>5 Action Buttons]
    end

    subgraph "1. Browse Archives"
        BA_Click[Click: Browse Archives]
        BA_Modal[Show GenreSelectionModal]
        BA_Filter[Filter Kethaneum if not revealed]
        BA_Select[User selects genre]
        BA_State[Update selectedGenre state]
        BA_Clear[Clear grid & puzzle state]
        BA_Navigate[Navigate to /puzzle]
    end

    subgraph "2. Start Conversation"
        SC_Click[Click: Start Conversation]
        SC_Check{Story events<br/>available?}
        SC_Story[Play Story Event<br/>Multi-character sequence]
        SC_Banter[Show Random Banter<br/>Single character]
        SC_Complete[Mark event complete<br/>or end banter]
        SC_Clear[Clear notification if<br/>all events done]
    end

    subgraph "3. Book of Passage"
        BP_Click[Click: Book of Passage]
        BP_Navigate[Navigate to /book-of-passage]
    end

    subgraph "4. Return to Main Menu"
        MM_Click[Click: Return to Menu]
        MM_Navigate[Navigate to /]
    end

    subgraph "5. Open Settings"
        Set_Click[Click: Settings]
        Set_Modal[Show SettingsMenu]
        Set_Config[Adjust audio, difficulty, etc.]
        Set_Close[Close modal]
    end

    Center --> BA_Click
    Center --> SC_Click
    Center --> BP_Click
    Center --> MM_Click
    Center --> Set_Click

    BA_Click --> BA_Modal
    BA_Modal --> BA_Filter
    BA_Filter --> BA_Select
    BA_Select --> BA_State
    BA_State --> BA_Clear
    BA_Clear --> BA_Navigate

    SC_Click --> SC_Check
    SC_Check -->|Yes| SC_Story
    SC_Check -->|No| SC_Banter
    SC_Story --> SC_Complete
    SC_Banter --> SC_Complete
    SC_Complete --> SC_Clear

    BP_Click --> BP_Navigate
    MM_Click --> MM_Navigate
    Set_Click --> Set_Modal
    Set_Modal --> Set_Config
    Set_Config --> Set_Close

    style BA_Modal fill:#e3f2fd
    style SC_Story fill:#fff3e0
    style SC_Banter fill:#f3e5f5
    style Set_Modal fill:#ffebee
```

## Genre Selection Flow

```mermaid
sequenceDiagram
    participant Player
    participant Library as Library Screen
    participant Modal as GenreSelectionModal
    participant Selector as puzzleSelector
    participant GameState
    participant Router

    Player->>Library: Click "Browse Archives"
    Library->>Library: setShowGenreModal(true)
    Library->>Modal: Render modal

    Modal->>Modal: Filter genres<br/>(hide Kethaneum if not revealed)
    Modal->>Player: Display genre cards

    Player->>Modal: Click genre card
    Modal->>Library: onSelectGenre(genre)
    Library->>Library: setShowGenreModal(false)

    Library->>Library: Ensure puzzles loaded<br/>await loadAll()
    Library->>GameState: setState(prevState => ...)
    activate GameState

    GameState->>Selector: selectGenre(state, genre)
    Selector-->>GameState: Updated state with:<br/>• selectedGenre<br/>• Reset counters

    GameState->>GameState: Check puzzle state:<br/>• Same genre + incomplete?<br/>• Same genre + complete?<br/>• Different genre?

    alt Same genre + incomplete puzzle
        GameState->>GameState: Keep current state<br/>Preserve puzzle for restore
    else Same genre + complete puzzle
        GameState->>GameState: Clear puzzleIndex & storyPart<br/>Preserve currentBook
    else Different genre
        GameState->>GameState: Clear all:<br/>currentGenre, currentBook,<br/>puzzleIndex, storyPart
    end

    GameState->>GameState: Clear grid & wordList<br/>Force puzzle reload

    deactivate GameState

    Library->>Router: router.push('/puzzle')
    Router-->>Player: Navigate to puzzle screen
```

## Conversation System: Story Event vs Banter

```mermaid
graph TB
    Start[Click: Start Conversation]

    Start --> SetActive[setConversationActive true]
    SetActive --> WaitQueue[Wait for DialogueQueue mount<br/>Ensure ref available]
    WaitQueue --> ClearQueue[Clear dialogue queue<br/>Remove old panels]

    ClearQueue --> GetBeat[Get currentStoryBeat from state]
    GetBeat --> CheckEvents{Story events<br/>available?}

    CheckEvents -->|Use EventChecker| GetCompleted[Get completedStoryEvents<br/>Union of state + ref]
    GetCompleted --> QueryEvents[dialogueManager.getAvailableStoryEvent]

    QueryEvents --> HasEvent{Event<br/>available?}

    HasEvent -->|Yes| PlayEvent[Play Story Event]
    HasEvent -->|No| PlayBanter[Play Random Banter]

    PlayEvent --> CreatePlayer[new StoryEventPlayer]
    PlayEvent --> SetupCallbacks[Setup callbacks:<br/>• onDialogue<br/>• onCompleted]
    SetupCallbacks --> LoadEvent[player.loadStoryEvent id]
    LoadEvent --> ValidateEvent{Event valid?}
    ValidateEvent -->|No| ErrorCleanup[Clean up & end]
    ValidateEvent -->|Yes| StartPlayer[player.start]
    StartPlayer --> PreloadPortraits[Preload portraits<br/>Background, non-blocking]
    PreloadPortraits --> EmitDialogue[Emit dialogue entries<br/>to queue]

    PlayBanter --> GetBanter[dialogueManager.getRandomBanter beat]
    GetBanter --> GetCharacter[Get character data]
    GetCharacter --> ChunkBanter[chunkText dialogue.text]
    ChunkBanter --> BuildEntry[Build DialogueEntry]
    BuildEntry --> AddToQueue[Add to dialogue queue]

    EmitDialogue --> ShowDialogue[Display in DialogueQueue]
    AddToQueue --> ShowDialogue
    ShowDialogue --> WaitContinue[Wait for player to continue]

    WaitContinue --> ContinueClick[Click Continue]
    ContinueClick --> CheckType{Story Event<br/>or Banter?}

    CheckType -->|Story Event| AdvancePlayer[eventPlayer.advance]
    CheckType -->|Banter| EndBanter[Clear queue & end]

    AdvancePlayer --> MoreDialogue{More dialogue?}
    MoreDialogue -->|Yes| EmitDialogue
    MoreDialogue -->|No| OnComplete[player.onCompleted]

    OnComplete --> MarkComplete[Mark event as completed<br/>in completedStoryEvents]
    MarkComplete --> UpdateRef[Update completedEventsRef]
    UpdateRef --> CheckRemaining{More unlocked<br/>events?}
    CheckRemaining -->|No| ClearNotif[clearNewDialogue]
    CheckRemaining -->|Yes| KeepNotif[Keep notification]
    ClearNotif --> EndConv[End conversation]
    KeepNotif --> EndConv
    EndBanter --> EndConv

    EndConv --> SetInactive[setConversationActive false]

    style PlayEvent fill:#fff3e0
    style PlayBanter fill:#f3e5f5
    style MarkComplete fill:#c8e6c9
    style ClearNotif fill:#e3f2fd
```

## Story Event Playback Detailed Flow

```mermaid
sequenceDiagram
    participant Library
    participant Player as StoryEventPlayer
    participant DialogueMgr as DialogueManager
    participant Queue as DialogueQueue
    participant GameState
    participant NotifCtx as Notification Context

    Library->>Player: new StoryEventPlayer(dialogueManager)
    Library->>Player: Setup callbacks

    Note over Player: onDialogue callback:<br/>Add entry to queue

    Note over Player: onCompleted callback:<br/>Mark event complete

    Library->>Player: loadStoryEvent(eventId)
    activate Player

    Player->>DialogueMgr: getStoryEvent(eventId)
    DialogueMgr-->>Player: StoryEvent data

    Player->>Player: Validate event structure
    Player->>Player: Build dialogue sequence
    Player->>Player: Resolve character refs

    deactivate Player

    Library->>Player: start()
    activate Player

    Player->>Player: currentIndex = 0
    Player->>Player: emitNextDialogue()

    Player->>Player: Get dialogue[currentIndex]
    Player->>DialogueMgr: getCharacterById(speaker)
    DialogueMgr-->>Player: Character data

    Player->>Player: chunkText(dialogue.text)
    Player->>Player: Build DialogueEntry

    Player->>Library: onDialogue(entry)
    Library->>Queue: addDialogue(entry)

    deactivate Player

    Queue->>Queue: Show dialogue panel<br/>with animation

    Note over Library,Queue: Player reads dialogue...

    Library->>Player: advance()
    activate Player

    Player->>Player: handleChunkOrAdvance()

    alt More chunks in current dialogue
        Player->>Queue: Show next chunk
    else No more chunks
        Player->>Player: currentIndex++
        Player->>Player: emitNextDialogue()

        alt More dialogue entries
            Player->>Library: onDialogue(next entry)
            Library->>Queue: addDialogue(next entry)
        else Sequence complete
            Player->>Library: onCompleted()
            Library->>GameState: Mark event completed
            Library->>NotifCtx: Check & clear notification
            Library->>Library: End conversation
        end
    end

    deactivate Player
```

## Notification System Integration

```mermaid
stateDiagram-v2
    [*] --> NoNotification: Initial state

    NoNotification --> CheckOnLoad: Library loads

    state CheckOnLoad {
        [*] --> GetCurrentState
        GetCurrentState --> GetCompletedEvents
        GetCompletedEvents --> CheckTriggers
    }

    CheckOnLoad --> AvailableEventsFound: StoryEventTriggerChecker<br/>finds available events
    CheckOnLoad --> NoEventsAvailable: No events match triggers

    AvailableEventsFound --> NotificationActive: setNewDialogueAvailable()

    state NotificationActive {
        [*] --> ShowGlow
        ShowGlow --> PulseAnimation: Visual glow on<br/>"Start Conversation" button
    }

    NotificationActive --> EventsRemain: Event completed but<br/>more unlocked events exist
    NotificationActive --> NotificationCleared: All unlocked events<br/>completed

    EventsRemain --> NotificationActive: Keep showing notification

    NotificationCleared --> NoNotification: clearNewDialogue()

    NoEventsAvailable --> NoNotification

    note right of AvailableEventsFound
        Triggered by:
        - StoryEventTriggerChecker.checkCurrentlyAvailableEvents()
        - Filters by completedStoryEvents
        - Checks trigger patterns match current state
    end note

    note right of NotificationCleared
        Cleared when:
        - All available events completed
        - In player.onCompleted callback
        - After updating completedStoryEvents
    end note
```

## State Management & Refs

```mermaid
graph TB
    subgraph "React State"
        StateConv[conversationActive: boolean]
        StateModal[showGenreModal: boolean]
        StateSettings[showSettingsMenu: boolean]
    end

    subgraph "React Refs"
        RefQueue[dialogueQueueRef<br/>Access to queue methods]
        RefPlayer[eventPlayerRef<br/>Current story event player]
        RefEventId[currentEventIdRef<br/>Event being played]
        RefCompleted[completedEventsRef<br/>Sync copy of completedStoryEvents]
    end

    subgraph "GameState (Persisted)"
        GS_Completed[dialogue.completedStoryEvents: string[]]
        GS_Visited[dialogue.hasVisitedLibrary: boolean]
        GS_Genre[selectedGenre: string]
        GS_Puzzles[puzzles, currentGenre, etc.]
    end

    subgraph "Synchronization"
        SyncEffect[useEffect:<br/>Sync ref ↔ state]
        ValidateEffect[useEffect:<br/>Validate consistency]
    end

    RefCompleted -.->|Updates| GS_Completed
    GS_Completed -.->|Loads| RefCompleted

    SyncEffect --> RefCompleted
    SyncEffect --> GS_Completed

    ValidateEffect --> RefCompleted
    ValidateEffect --> GS_Completed

    RefQueue -.->|Calls| DialogueQueue
    RefPlayer -.->|Calls| EventPlayer
    RefEventId -.->|Tracks| CurrentEvent

    StateConv -->|Controls| DialogueQueue
    StateModal -->|Controls| GenreModal
    StateSettings -->|Controls| SettingsModal

    style RefCompleted fill:#fff9c4
    style GS_Completed fill:#c8e6c9
    style SyncEffect fill:#e3f2fd
```

## Completed Events Tracking System

```mermaid
sequenceDiagram
    participant Player
    participant EventPlayer
    participant Library
    participant GameState
    participant Ref as completedEventsRef
    participant SaveSys as Save System

    Note over GameState,Ref: Initial: completedStoryEvents = []

    Player->>EventPlayer: Complete story event
    EventPlayer->>Library: onCompleted()
    activate Library

    Library->>Library: Get completedId from ref
    Library->>GameState: setState(prevState => ...)
    activate GameState

    GameState->>GameState: Get prev completedEvents []
    GameState->>GameState: Validate is array ✓
    GameState->>GameState: Check not already completed ✓
    GameState->>GameState: Create updated array<br/>[...prev, completedId]

    GameState->>GameState: Build updated state for check
    GameState->>DialogueMgr: getAvailableStoryEvents<br/>(updated state)
    DialogueMgr-->>GameState: remainingEvents

    alt No remaining events
        GameState->>NotifContext: clearNewDialogue()
    else Events remain
        Note over GameState: Keep notification active
    end

    GameState->>Ref: Update ref immediately<br/>(synchronous access)
    Ref-->>GameState: Ref updated

    GameState-->>Library: Return new state

    deactivate GameState

    Library->>Library: Wait 100ms for propagation
    Library->>Ref: Verify ref was updated ✓
    Library->>Library: Wait 200ms for display
    Library->>Queue: Clear dialogue queue
    Library->>Library: End conversation

    deactivate Library

    GameState->>SaveSys: Auto-save<br/>Persist completedStoryEvents

    Note over GameState,SaveSys: State persisted to localStorage
```

## Genre Selection State Handling

```mermaid
graph TB
    Start[User selects genre]

    Start --> SetState[setState with callback]
    SetState --> CheckGenre{Genre valid<br/>in puzzles?}

    CheckGenre -->|No| ReturnPrev[Return prevState<br/>No changes]
    CheckGenre -->|Yes| CallSelector[selectGenre state, genre]

    CallSelector --> CheckSame{Same genre as<br/>currentGenre?}

    CheckSame -->|No| DifferentGenre[Different Genre Path]
    CheckSame -->|Yes| CheckPuzzleIndex{Has valid<br/>puzzleIndex?}

    CheckPuzzleIndex -->|No| DifferentGenre
    CheckPuzzleIndex -->|Yes| GetCurrent[Get currentPuzzle]

    GetCurrent --> CheckCompleted{Puzzle<br/>completed?}

    CheckCompleted -->|No| IncompleteCase[Incomplete Puzzle Case]
    CheckCompleted -->|Yes| CompleteCase[Complete Puzzle Case]

    IncompleteCase --> KeepAll[Keep all current state:<br/>• currentGenre<br/>• currentBook<br/>• currentPuzzleIndex<br/>• currentStoryPart]

    CompleteCase --> PreserveBook[Preserve book, clear puzzle:<br/>• Keep currentGenre<br/>• Keep currentBook<br/>• Clear currentPuzzleIndex = -1<br/>• Clear currentStoryPart = -1]

    DifferentGenre --> ClearAll[Clear all current state:<br/>• currentGenre = ''<br/>• currentBook = ''<br/>• currentPuzzleIndex = -1<br/>• currentStoryPart = -1]

    KeepAll --> ClearGrid[Clear grid & wordList<br/>gameOver = false]
    PreserveBook --> ClearGrid
    ClearAll --> ClearGrid

    ClearGrid --> ReturnNew[Return updated state]

    ReturnNew --> Navigate[Navigate to /puzzle]

    style IncompleteCase fill:#fff9c4
    style CompleteCase fill:#c8e6c9
    style DifferentGenre fill:#ffcdd2
```

## Access Control & Loading States

```mermaid
graph TB
    Start[Navigate to /library]

    Start --> CheckMode{gameMode === 'story'?}

    CheckMode -->|No| Redirect[Redirect to /puzzle<br/>Library is Story mode only]
    CheckMode -->|Yes| CheckLoading{Dependencies ready?}

    CheckLoading -->|No| ShowLoader[Display PageLoader<br/>"Loading Library Archives..."]
    CheckLoading -->|Yes| DisplayLibrary[Display Library Screen]

    ShowLoader --> CheckDeps[Check dependencies:<br/>• gameStateReady<br/>• isInitialized (dialogue)<br/>• puzzles loaded<br/>• storyProgress ready]

    CheckDeps --> CheckLoading

    DisplayLibrary --> InitDialogue[Initialize dialogue system<br/>if not initialized]
    InitDialogue --> LoadPuzzles{Puzzles loaded?}
    LoadPuzzles -->|No| LoadAll[loadAll puzzles]
    LoadPuzzles -->|Yes| CheckNotif[Check for available events<br/>Set notification state]

    LoadAll --> CheckNotif
    CheckNotif --> Ready[Library ready for interaction]

    style Redirect fill:#ffcdd2
    style ShowLoader fill:#fff9c4
    style Ready fill:#c8e6c9
```

## Dialogue Queue Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Inactive: conversationActive = false

    Inactive --> Mounting: Click "Start Conversation"

    state Mounting {
        [*] --> SetActive
        SetActive --> WaitForRef
        WaitForRef --> RefAvailable: dialogueQueueRef ready
        WaitForRef --> RefTimeout: 10 retries + 50ms timeout
    }

    RefAvailable --> ClearQueue: Clear old panels

    state Active {
        [*] --> AddingDialogue
        AddingDialogue --> DisplayingPanels: Panels animate in
        DisplayingPanels --> WaitingForContinue: Show Continue button
        WaitingForContinue --> AdvancingSequence: User clicks Continue
        AdvancingSequence --> AddingDialogue: More dialogue
        AdvancingSequence --> Completing: Sequence done
    }

    ClearQueue --> Active
    RefTimeout --> Inactive: Error - abort

    Completing --> MarkingComplete: Update completedStoryEvents
    MarkingComplete --> ClearingQueue: Clear panels
    ClearingQueue --> Inactive: setConversationActive false

    note right of RefAvailable
        Critical: Queue ref MUST be available
        before starting event playback.
        Multiple retries with RAF ensure
        React has rendered the component.
    end note
```

## Banter vs Story Event Comparison

```mermaid
graph LR
    subgraph "Banter (Random Dialogue)"
        B_Trigger[Trigger: No story events available]
        B_Selection[dialogueManager.getRandomBanter]
        B_Character[Single character]
        B_Weighted[Weighted random selection<br/>Avoid recent characters]
        B_Chunking[Smart text chunking<br/>Device-aware]
        B_Display[Single dialogue entry<br/>One panel]
        B_Continue[Continue: End conversation]
        B_Complete[No state update<br/>Just clear queue]
    end

    subgraph "Story Event (Scripted Sequence)"
        SE_Trigger[Trigger: Milestone reached<br/>Event unlocked]
        SE_Selection[dialogueManager.getAvailableStoryEvent]
        SE_Characters[Multi-character sequence]
        SE_Player[StoryEventPlayer orchestrates]
        SE_Sequence[Multiple dialogue entries<br/>Ordered by sequence]
        SE_Continue[Continue: Advance sequence]
        SE_Complete[Mark event as completed<br/>Update completedStoryEvents]
        SE_Check[Check remaining events<br/>Clear notification if done]
    end

    style B_Display fill:#f3e5f5
    style B_Complete fill:#e1bee7
    style SE_Sequence fill:#fff3e0
    style SE_Complete fill:#c8e6c9
    style SE_Check fill:#e3f2fd
```

## Integration Points

```mermaid
graph TB
    subgraph "Library Screen"
        Library[Library Screen]
    end

    subgraph "Dialogue System"
        DialogueMgr[DialogueManager<br/>Character & event data]
        EventChecker[StoryEventTriggerChecker<br/>Check trigger conditions]
        EventPlayer[StoryEventPlayer<br/>Playback orchestrator]
    end

    subgraph "Puzzle System"
        PuzzleSelector[Puzzle Selector<br/>Genre selection]
        PuzzleLoader[Puzzle Loader<br/>Load all puzzles]
    end

    subgraph "Story Progression"
        StoryBeat[Story Beat<br/>Current narrative stage]
        CompletedEvents[Completed Story Events<br/>Track finished sequences]
    end

    subgraph "Save System"
        SaveProg[Save Progress<br/>completedStoryEvents,<br/>selectedGenre, etc.]
    end

    subgraph "Notification System"
        Notifications[Visual Notifications<br/>Glow on buttons]
    end

    subgraph "Navigation"
        ToBookPass[→ Book of Passage]
        ToPuzzle[→ Puzzle Screen]
        ToMain[→ Main Menu]
    end

    Library --> DialogueMgr
    Library --> EventChecker
    Library --> EventPlayer
    Library --> PuzzleSelector
    Library --> PuzzleLoader

    EventChecker --> StoryBeat
    EventChecker --> CompletedEvents
    EventPlayer --> DialogueMgr

    PuzzleSelector --> SaveProg
    CompletedEvents --> SaveProg
    SaveProg -.->|Load| Library

    EventChecker --> Notifications
    Notifications --> Library

    Library --> ToBookPass
    Library --> ToPuzzle
    Library --> ToMain

    style Library fill:#4CAF50,stroke:#2E7D32,color:#fff
    style DialogueMgr fill:#2196F3,stroke:#1565C0,color:#fff
    style EventPlayer fill:#FF9800,stroke:#E65100,color:#fff
    style Notifications fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

## Key Features & Behaviors

```mermaid
graph LR
    subgraph "Features"
        F1[Five Action Buttons<br/>Browse | Converse | Book | Menu | Settings]
        F2[Smart Conversation Routing<br/>Story events prioritized over banter]
        F3[Story Event Tracking<br/>Never replay completed events]
        F4[Kethaneum Reveal<br/>Hidden until first encounter]
        F5[Visual Notifications<br/>Glow for new events]
        F6[Ref + State Sync<br/>Reliable completion tracking]
        F7[Story Mode Only<br/>Auto-redirect other modes]
        F8[Weighted Banter<br/>Avoid repetition]
    end

    subgraph "Behaviors"
        B1[Clear Queue on Start<br/>No stale dialogue]
        B2[Wait for Ref Mount<br/>Ensure queue ready]
        B3[Immediate Ref Update<br/>Synchronous access]
        B4[Notification Persistence<br/>Survives page refresh]
        B5[State Validation<br/>Check array integrity]
        B6[Error Recovery<br/>Clean up on failure]
        B7[Portrait Preloading<br/>Background, non-blocking]
        B8[Chunked Text Display<br/>Device-aware]
    end

    style F2 fill:#fff3e0
    style F3 fill:#c8e6c9
    style F5 fill:#e3f2fd
    style B3 fill:#fff9c4
    style B4 fill:#ffebee
    style B6 fill:#ffcdd2
```

## Error Handling & Recovery

```mermaid
flowchart TD
    Start[Start Conversation]

    Start --> CheckDialogueMgr{DialogueManager<br/>ready?}
    CheckDialogueMgr -->|No| ErrorNotReady[Log error<br/>Abort conversation]
    CheckDialogueMgr -->|Yes| WaitQueue[Wait for queue ref]

    WaitQueue --> RefReady{Ref available<br/>after retries?}
    RefReady -->|No| ErrorNoRef[Log error<br/>setConversationActive false]
    RefReady -->|Yes| ClearQueue[Clear queue]

    ClearQueue --> TryClear{Clear<br/>success?}
    TryClear -->|Error| LogClearError[Log error<br/>Continue anyway]
    TryClear -->|Success| GetEvent[Get available event]

    LogClearError --> GetEvent
    GetEvent --> TryGetEvent{Get event<br/>success?}
    TryGetEvent -->|Error| ErrorGetEvent[Log error<br/>Clean up & end]
    TryGetEvent -->|Success| ValidateEvent{Event<br/>structure valid?}

    ValidateEvent -->|No| ErrorInvalidEvent[Log error<br/>Clean up & end]
    ValidateEvent -->|Yes| LoadEvent[Load story event]

    LoadEvent --> TryLoad{Load<br/>success?}
    TryLoad -->|Error| ErrorLoad[Log error<br/>Clean up & end]
    TryLoad -->|Success| StartEvent[Start event]

    StartEvent --> TryStart{Start<br/>success?}
    TryStart -->|Error| ErrorStart[Log error<br/>Clean up & end]
    TryStart -->|Success| Playback[Event playback]

    Playback --> OnComplete[onCompleted callback]
    OnComplete --> TryUpdate{State update<br/>success?}
    TryUpdate -->|Error| ErrorUpdate[Log error<br/>Return prevState]
    TryUpdate -->|Success| VerifyRef{Ref updated?}

    VerifyRef -->|No| ErrorRefNotUpdated[CRITICAL error<br/>Throw]
    VerifyRef -->|Yes| Success[Success]

    ErrorNotReady --> End[Conversation not started]
    ErrorNoRef --> End
    ErrorGetEvent --> End
    ErrorInvalidEvent --> End
    ErrorLoad --> End
    ErrorStart --> End
    ErrorUpdate --> End
    ErrorRefNotUpdated --> End
    Success --> End

    style ErrorNotReady fill:#ffcdd2
    style ErrorNoRef fill:#ffcdd2
    style ErrorGetEvent fill:#ffcdd2
    style ErrorInvalidEvent fill:#ffcdd2
    style ErrorLoad fill:#ffcdd2
    style ErrorStart fill:#ffcdd2
    style ErrorUpdate fill:#ffcdd2
    style ErrorRefNotUpdated fill:#ffcdd2
    style Success fill:#c8e6c9
```

## Performance Characteristics

- **Page Load**: ~200-1000ms (depends on puzzle data size)
- **Dialogue System Init**: ~50-200ms (character & event loading)
- **Puzzle Load (All Genres)**: ~100-500ms (parallel fetch)
- **Genre Selection**: ~1-5ms (state update)
- **Event Trigger Check**: ~1-5ms (indexed by story beat)
- **Banter Selection**: ~1-5ms (weighted random)
- **Story Event Load**: ~10-50ms (resolve characters, build sequence)
- **Dialogue Entry Display**: ~500ms (panel animation)
- **Ref Wait Retries**: ~10-60ms (requestAnimationFrame × 10)
- **State Save Propagation**: ~100-200ms (debounced)

## Testing Considerations

Key areas to test when modifying the Library Screen:

1. **Genre Selection**
   - Kethaneum hidden until revealed
   - Genre state updates correctly
   - Puzzle state cleared/preserved appropriately
   - Navigation to puzzle screen works

2. **Story Event System**
   - Events trigger on correct conditions
   - Completed events never replay
   - Ref and state stay synchronized
   - Notification clears when all events done
   - Multi-character sequences play in order

3. **Banter System**
   - Displays when no events available
   - Weighted selection avoids repetition
   - Text chunking works correctly
   - Single panel display

4. **Notification System**
   - Glow appears on new events
   - Survives page refresh
   - Clears when all events complete
   - Respects completed events list

5. **Queue Management**
   - Queue clears before new conversation
   - Ref available before playback starts
   - Panels animate correctly
   - Continue button advances properly

6. **State Persistence**
   - completedStoryEvents saves
   - hasVisitedLibrary sets on first-visit
   - selectedGenre persists
   - Ref syncs with state on load

7. **Error Recovery**
   - Graceful degradation on errors
   - Cleanup on failure
   - No stuck conversation states
   - Validation prevents corruption

## Future Considerations

1. **Character Profiles**: View detailed character bios from library
2. **Event History**: Replay completed story events
3. **Achievement Integration**: Library-specific achievements
4. **Quest System**: Track objectives from the library
5. **Reading Nook**: Read completed book excerpts in library
6. **Librarian Guide**: Tutorial/hint character in library
7. **Bookshelf Visualization**: 3D bookshelf with books
8. **Character Portraits**: Display during conversations
9. **Voice Acting**: Audio narration for events
10. **Parallel Conversations**: Multiple characters talking simultaneously
