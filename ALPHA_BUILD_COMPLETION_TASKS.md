# Alpha Build Completion Tasks

## Current Status

### Story End Screen (`/story-end`)
**Status**: Mostly complete, needs one button
- ✅ End of Game text Area
- ✅ Scrollbar (already implemented in CSS)
- ✅ Return to Library Button
- ✅ Return to Title Screen Button (Main Menu)
- ❌ **Missing**: Return to Book of Passage Button

### Credits Screen (`/credits`)
**Status**: Does not exist
- ❌ Credits Screen page/route
- ❌ Credits Text Area
- ❌ Scrollbar
- ❌ Back to Title Screen Button
- ❌ Navigation from Title Screen (button exists but disabled)

## Tasks

### 1. Story End Screen - Add Return to Book of Passage Button
- [ ] Add button handler `handleReturnToBookOfPassage`
- [ ] Add button to button group
- [ ] Style button to match existing buttons
- [ ] Test navigation

### 2. Credits Screen - Create New Screen
- [ ] Create `app/credits/page.tsx`
- [ ] Create `app/credits/credits.module.css`
- [ ] Add CosmicBackground with appropriate variant
- [ ] Add credits text area with scrollbar
- [ ] Add "Back to Title Screen" button
- [ ] Add navigation from title screen (enable button)
- [ ] Style to match other screens
- [ ] Add credits content (placeholder or actual credits)

### 3. Other Missing Items (from feature list)
- [ ] Library Screen - Options Menu Panel (partially complete)
- [ ] Word Puzzle Screen - Options Menu Panel (partially complete)
- [ ] Book of Passage - Start Cataloging Button navigation

## Notes

- Story End Screen already has scrollbar implemented in CSS (`.bookContent` has `overflow-y: auto`)
- Credits button on title screen is currently disabled
- Need to check if there's credits content file or if we need to create placeholder content

