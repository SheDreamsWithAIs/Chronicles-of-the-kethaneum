# Fix Story Event Tracking and Selection Bug

## Problem Analysis

The second story event is playing the first event's text, indicating:
1. **Event selection issue**: Wrong event ID being selected from available events
2. **Event loading issue**: Correct event ID passed but wrong event loaded
3. **State synchronization issue**: Completed events not properly filtered

## Root Cause Investigation

The flow is:
1. `getAvailableStoryEvents(state, completedEvents)` returns array of event IDs
2. `getAvailableStoryEvent()` takes `availableEvents[0]` (first one)
3. Extracts `eventId = availableEvent.storyEvent.id`
4. Calls `player.loadStoryEvent(eventId)`
5. `loadStoryEvent` calls `dialogueManager.getStoryEvent(eventId)`

**Potential issues:**
- Non-deterministic ordering in `checkCurrentlyAvailableEvents()` - order depends on Map iteration
- Event ID mismatch between what's selected and what's loaded
- Completed events not properly filtered before selection

## Solution Approach

### 1. Ensure Deterministic Event Ordering
- Sort available events by event ID before returning
- Ensures consistent selection order when multiple events are available
- Prevents race conditions from Map iteration order

### 2. Add Event ID Validation with Error Handling
- Validate event ID matches between selection and loading
- Throw descriptive errors if mismatches detected
- Fail fast with clear error messages instead of silent failures

### 3. Fix Completed Events Filtering
- Ensure `completedEvents` is properly synchronized before filtering
- Add validation that completed events are actually excluded
- Double-check filtering logic in `getAvailableStoryEvents`

### 4. Add Defensive Logging
- Log event ID at each step: selection, extraction, loading
- Log the actual event object loaded to verify correctness
- Add validation warnings if mismatches detected

## Implementation Details

### File: `lib/dialogue/DialogueManager.ts`
- **`getAvailableStoryEvents()`**: Sort returned event IDs alphabetically for deterministic ordering
- **`getAvailableStoryEvent()`**: 
  - Validate that returned event ID matches what was requested
  - Throw error if event ID mismatch detected
  - Return null gracefully if no events available (not an error condition)

### File: `lib/dialogue/StoryEventPlayer.ts`
- **`loadStoryEvent()`**: 
  - Validate that loaded event ID matches requested ID
  - Throw descriptive error if mismatch detected: `Event ID mismatch: requested '${eventId}' but loaded '${loadedEventId}'`
  - Throw error if event not found (already exists, but ensure message is clear)

### File: `app/library/page.tsx`
- **`handleStartConversation()`**: 
  - Validate that `availableEvent.storyEvent.id` matches what gets loaded
  - Wrap event loading in try-catch with proper error handling
  - Show user-friendly error message if event loading fails
  - Ensure conversation state is cleaned up on error

### File: `lib/dialogue/StoryEventTriggerChecker.ts`
- **`checkCurrentlyAvailableEvents()`**: Sort returned event IDs for deterministic ordering
- Ensure consistent ordering regardless of Map iteration order

## Testing Strategy

1. Test with two available events - verify first click plays first event
2. Complete first event - verify it's marked complete
3. Second click - verify second event plays (not first event again)
4. Verify event IDs match at each step
5. Test with multiple events to ensure ordering is consistent

## Risk Assessment

- **Low Risk**: Changes are additive (validation/logging) and deterministic ordering
- **No Breaking Changes**: Existing functionality preserved, just made more robust
- **Easy Rollback**: Can revert if issues arise

## Implementation Todos

1. **Sort events deterministic**: Sort event IDs in checkCurrentlyAvailableEvents() and getAvailableStoryEvents() for deterministic ordering
2. **Validate event selection**: Add validation in getAvailableStoryEvent() to ensure returned event ID matches selection
3. **Validate event loading**: Add validation in StoryEventPlayer.loadStoryEvent() to verify loaded event matches requested ID
4. **Add error handling**: Wrap event loading in try-catch in handleStartConversation(), handle errors gracefully and clean up state
5. **Test event tracking**: Test with two events to verify correct event plays on each click