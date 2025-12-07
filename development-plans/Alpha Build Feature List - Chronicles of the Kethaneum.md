# Chronicles of the Kethaneum - Alpha Build Feature List

## .:: Basic UI ::.

### Title Screen
- [x] Title and Subtitle
- [x] New Game Button
- [x] Continue Game Button
- [x] Options Button
- [x] Option Menu Panel
  - [x] Background Music Volume Slider
  - [x] Voice Acting Volume Slider
  - [x] Sound Effects Volume Slider
  - [x] Mute Everything Button
  - [x] Back to Title Screen Button
- [x] Credits Button
- [x] Game Logo Area

### Credits Screen
- [x] Credits Text Area
- [x] Scrollbar
- [x] Back to Title Screen Button

### Backstory Screen
- [x] Backstory Blurb Area
- [x] Scrollbar
- [x] Continue Game Button

### Library Screen
- [x] Library Art Container
- [x] Character dialog start button
- [x] Go to Main Menu button
- [x] Go to Book of Passage Button
- [x] Options/settings button
- [x] Genre Selection UI button
  - [x] Genre card container
  - [x] Genre Selection cards
- [x] Character Dialogue System Integration 
  - [x] Dialogue overlay container
  - [x] Character portrait area
  - [x] Dialogue text display area
  - [x] Dialogue navigation controls
- [x] Options Menu Panel
  - [x] Menu Title 
  - [x] Volume Sliders
  - [x] Mute Button
  - [x] Back to Library Screen Button

### Book of Passage Screen
- [x] Book of Passage Title
- [x] Story and Progress Container
  - [x] The Archivist's (Player Character) story so far text
  - [x] Archivist's story history Area
    - [x] Archivist's story history text
    - [x] History Navigation Buttons (it's a scrollbar for now)
  - [x] Books Discovered counter
  - [x] Books Cataloged counter
  - [x] Book Progress tracker 
    - [x] Book Progress Navigation Buttons
    - [x] Completed Books
    - [x] In Progress Books
- [x] Story and Progress Navigation Buttons (Get to different sections in the Book of Passage)
- [x] Scrollbar
- [ ] Start Cataloging Button
- [x] Enter the Library Button


### Word Puzzle Screen
- [x] Book Title
- [x] Story excerpt Area
- [x] Word Puzzle grid
- [x] Word List
- [x] Pause Cataloging Button (Open pause menu)
- [x] Pause Menu
  - [x] Resume Button
  - [x] Restart Puzzle Button
  - [x] Return to Library Button
  - [x] Quit to Title Screen Button
- [x] Option Menu Button
- [x] Options Menu Panel
  - [x] Menu Title 
  - [x] Volume Sliders
  - [x] Mute Button

### Story End Screen
- [x] End of Game text Area
- [x] Scrollbar
- [x] Return to Library Button
- [x] Return to Title Screen Button
___
## .:: Word Puzzle ::.

### Word Puzzle Screen
- [x] Programmatic Word placement
- [x] Programmatic Word grid filling
- [x] Word list loading and storage
- [x] Recognition of Word Selection
- [x] Win and Lose State Management
- [x] Puzzle Caching for loading
- [x] Timer System
- [ ] 4 Genres and 10 books for each Genre:
  - [ ] Sci Fi
  - [ ] Fantasy
  - [ ] Romance
  - [ ] kethaneum
___
## .:: Narrative Delivery ::.
- [x] Easy Narrative File Swap Out
- [x] Easy Puzzle File Swap Out

### Backstory Screen
- [x] Kethaneum Backstory Placeholder Text

### Library Screen
- [x] Placeholder Character Dialogue Text
- [x] Character dialogue system
  - [x] Event driven dialogue
  - [x] Banter dialogue
- [x] Genre Cards

### Core Dialogue Foundation
- [x] Dialogue folder structure and file organization
  - [x] `/dialogue/characters/` directory
  - [x] `/dialogue/story-events/` directory  
  - [x] `dialogue-config.json` configuration file
- [x] Basic DialogueManager module
  - [x] File loading system
  - [x] Error handling and validation
  - [x] Module integration with existing architecture
- [x] Character Banter System
  - [x] Random character selection logic
  - [x] Banter dialogue file structure (JSON)
  - [x] Character-specific dialogue loading
- [x] Story Event System  
  - [x] Sequential dialogue file structure (JSON)
  - [x] Multi-character conversation handling
  - [x] Story event triggering system
- [x] Dialogue UI Implementation
  - [x] Basic dialogue overlay panel
  - [x] Character portrait placeholder system
  - [x] Text display with responsive sizing
  - [x] Continue/advance dialogue controls
- [x] Library Screen Integration
  - [x] "Start Conversation" button functionality
  - [x] Dialogue panel show/hide management
  - [x] Integration with existing library navigation

### Book of Passage Screen
- [x] The Archivist's story so far Placeholder Text
- [x] Archivist's story history Placeholder Text 
- [x] Story system for revealing and allowing review of the archivist's story 

### Word Puzzle Screen
- [x] Word Puzzle Excerpt Text Content (especially Kethaneum related)

### Story End Screen
- [x] End of Game Placeholder Content
___
## .:: Navigation ::.

### Title Screen
- [x] Start a new Game (Go to Backstory Screen)
- [x] Load a saved game (Go to Book of Passage)
- [x] Navigate to credits screen

### Credits Screen
- [x] Navigate back to title screen

### Backstory Screen
- [x] Navigate to Library Screen

### Library Screen
- [x] Navigate to Book of Passage Screen
- [x] Navigate to Word Puzzle Screen through Genre Selection
- [x] Navigate to Title Screen

### Book of Passage Screen
- [ ] Navigate to word puzzle screen through start cataloging button
- [x] Navigate to library screen

### Word Puzzle Screen
- [x] Navigate to Book of Passage Screen through pause menu
- [x] Navigate to Library Screen through pause menu
- [x] Navigate to Title Screen through pause menu

### Story End Screen
- [x] Navigate to Library Screen
- [x] Navigate to Title Screen

### Options Menu
- [x] Navigate to Title Screen
___
## .:: Art ::.

### Concept Art
- [ ] Character Concept Art (deferred to post Alpha)
- [x] Title Screen Concept Art
- [x] Credits Screen Concept Art
- [x] Backstory Screen Concept Art
- [x] Book of Passage Concept Art
- [x] Library Concept Art
- [x] Word Puzzle Concept Art
- [ ] Border Designs (deferred to post Alpha)

### Credits Screen
- [ ] Border Art placeholders (deferred to post Alpha)
- [x] Twinkling Stars background animation

### Title Screen
- [ ] Border Art placeholders (deferred to post Alpha)
- [x] Twinkling Stars background animation

### Backstory Screen
- [x] Styled Scrollbar
- [ ] Border Art placeholders (deferred to post Alpha)
- [x] Twinkling Stars background animation

### Library Screen
- [ ] Library Art Placeholder (deferred to post Alpha)
- [x] Twinkling Stars background animation

### Book of Passage Screen
- [x] Styled Scrollbar
- [ ] Border Art placeholders (deferred to post Alpha)
- [x] Twinkling Stars background animation

### Word Puzzle Screen
- [ ] Border Art placeholders (deferred to post Alpha)
- [x] Twinkling Stars background animation
___
## .:: Save System ::.
- [x] Local Storage Implementation
  - [x] Player Story progress
  - [x] Completed books tracking
  - [x] Book part completion status
  - [x] Game state serialization and restoration
- [x] Auto-save on book/puzzle completion
- [x] Manual save through pause menu
- [ ] Save data integrity validation
- [x] Incomplete puzzle state preservation
  - [x] Ability to return to puzzles in progress
- [x] Historical Book completion tracking
___
## .:: Sound System ::.
  - [x] Background Music handler
  - [x] Sound Effects handler
  - [x] Voice Acting handler
  - [x] Selective Channel Muting
- [x] Single Background Music Track
- [ ] Sound Effects Placeholders
  - [ ] Navigation Button Clicks
  - [ ] Menu button Clicks
  - [ ] Button Hover Sound
  - [ ] Puzzle Completion
  - [ ] Puzzle Failure
- [ ] Voice Acting Placeholders (Deferred until post alpha)
___
## .:: Character Dialogue System ::.
  - [x] Character Image Handler
  - [x] Character Dialogue Handler
  - [x] Dialogue Navigation
  - [x] Event triggers 
___
## .:: Event System ::.
- [x] Core Event Publication/Subscription Architecture
- [x] Game State Event Handlers
  - [x] Puzzle Completion Events
  - [x] Word Discovery Events
  - [x] Book Completion Events
- [ ] UI Event Handlers
  - [x] Screen Navigation Events
  - [ ] Button Click Events
  - [x] Hover State Events
- [x] Narrative Event Triggers
  - [x] Character Dialogue Triggers
  - [x] Story Progression Triggers
- [ ] Audio Event Triggers
  - [ ] Music Change Events
  - [ ] Sound Effect Events
___
## .:: Test Set Up ::.
- [x] End to End Automated Test
- [x] Word Search Happy Path Automated Test