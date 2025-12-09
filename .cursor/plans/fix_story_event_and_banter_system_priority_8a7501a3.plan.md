---
name: Fix Story Event and Banter System Priority
overview: Refactor the conversation system so story events play one at a time per button click (not sequentially), with story events taking priority over banter. After all unlocked story events for the current story beat are completed, the system reverts to banter. Notifications persist until all unlocked events are completed.
todos:
  - id: remove-auto-banter
    content: Remove automatic banter logic from story event completion handler
    status: completed
  - id: fix-notification-clearing
    content: Fix notification clearing to only happen when all unlocked events for current beat are completed
    status: completed
  - id: simplify-completion-handler
    content: Simplify story event completion handler to end conversation and check for remaining events
    status: completed
  - id: test-single-event
    content: Test single unlocked story event plays correctly and ends conversation
    status: pending
  - id: test-multiple-events
    content: Test multiple unlocked story events require separate clicks (one per event)
    status: pending
  - id: test-banter-fallback
    content: Test banter appears correctly after all unlocked story events for current beat complete
    status: pending
  - id: test-notification-persistence
    content: Test notification persists while unlocked events remain and clears when all done
    status: pending
---

# Fix Story Event and Banter System Priority

## Current Issues

1. **Notification cleared too early** (line 274): `clearNewDialogue()` is called immediately when starting a conversation, but should only clear when ALL unlocked story events for the current story beat are completed.

2. **Banter starts automatically after story event** (lines 346-374): After a story event completes, the system automatically starts banter instead of ending the conversation and waiting for the next click.

3. **Sequential playback attempt**: The current code tries to play banter automatically after story events, but it should end the conversation instead.

## Important Context: Story Beat-Based Unlocking

- Story events are unlocked based on the **current story beat** (`state.storyProgress.currentStoryBeat`)
- `getAvailableStoryEvents(currentBeat)` already filters events by story beat
- Only events matching the current beat (or without beat restriction) are considered "available"
- When story beat advances (via StoryProgressionManager), new events become available
- "All story events done" means **all unlocked events for the current story beat**, not all events globally
- This enables gradual narrative reveal as the story progresses

## Required Behavior

- **Default state**: Character banter (when no unlocked story events available for current beat)
- **Priority**: Story events take priority over banter when unlocked events exist
- **One event per click**: Each click of "Start a Conversation" plays ONE unlocked story event, then ends
- **Sequential clicks**: User must click multiple times to play multiple unlocked events (one per click)
- **Notification persistence**: Notifications remain visible until ALL unlocked events for current beat are completed
- **Fallback**: After all unlocked events done, clicking "Start a Conversation" shows banter
- **Story beat changes**: When story beat advances, new events unlock and notifications appear again

## User Flow Example

**Scenario**: Two story events are unlocked for current beat, none completed yet.

1. **Click 1**: "Start a Conversation" → Plays first unlocked story event → Conversation ends
2. **Click 2**: "Start a Conversation" → Plays second unlocked story event → Conversation ends
3. **Click 3**: "Start a Conversation" → Shows random banter (all unlocked events completed)

## Implementation Plan

### 1. Remove Automatic Banter After Story Events

**File**: `app/library/page.tsx` (lines 321-378)

**Changes**:

- **Remove** the automatic banter logic from the `onCompleted` callback (lines 346-374)
- **Simplify** completion handler to only:

  1. Mark event as completed in state
  2. Clear dialogue queue
  3. End conversation (setConversationActive(false))
  4. Check if all unlocked events are done and clear notification if so

**Key**: After a story event completes, the conversation should END, not automatically start banter.

### 2. Fix Notification Clearing Logic

**File**: `app/library/page.tsx` (line 274 and completion handler)

**Changes**:

- **Remove** `clearNewDialogue()` call from line 274 (don't clear when starting conversation)
- **Add** notification clearing check in the story event completion handler:
  - After marking event complete, check if any unlocked events remain for current beat
  - If no unlocked events remain → clear notification
  - If unlocked events remain → keep notification visible

### 3. Refactor `handleStartConversation`

**File**: `app/library/page.tsx` (lines 248-435)

**Changes**:

- **Remove** `clearNewDialogue()` call from line 274
- **Keep** the existing story event vs banter check logic
- **Simplify** story event completion handler (remove banter auto-start)
- **Ensure** conversation ends after each story event completes

**Flow**:

1. Get current story beat from `state.storyProgress.currentStoryBeat`
2. Check for available story events for current beat (filter completed ones)
3. If unlocked story events exist → play ONE event, then end conversation
4. If no unlocked story events → show banter
5. Don't clear notification until all unlocked events for current beat are done

### 4. Update Story Event Completion Handler

**File**: `app/library/page.tsx` (inside story event `onCompleted` callback, lines 321-378)

**New completion logic**:

1. Mark current event as completed in state
2. Clear dialogue queue
3. **Get current story beat** (may have changed if story progressed)
4. **Check for remaining unlocked events** for CURRENT beat:

   - Get all available events for current beat
   - Filter out completed events
   - Count remaining unlocked events

5. **If no remaining unlocked events** → clear notification
6. **If remaining unlocked events exist** → keep notification visible
7. End conversation (setConversationActive(false))

**Important**:

- Always check events for the CURRENT story beat
- Only consider events that are unlocked for the current beat
- Use `getAvailableStoryEvents(currentBeat)` to ensure proper filtering
- End conversation after each event (don't auto-play next)

### 5. Update Notification Check Logic

**File**: `app/library/page.tsx` (lines 72-125)

**Current behavior**: Already correctly filters by story beat and completed events.

**No changes needed** - this logic is correct. It:

- Checks for available events for current story beat on page load
- Filters out completed events
- Sets notification if unlocked events available
- Clears notification if all unlocked events for current beat completed

**Note**: When story beat advances, this effect will re-run and detect new unlocked events, setting notification again.

### 6. Handle Edge Cases

**Considerations**:

- **State synchronization**: Ensure state updates complete before checking for remaining events
- **Story beat changes**: Always use current beat when checking for events
- **Error handling**: If a story event fails to load, fall back gracefully
- **User interruption**: If user ends conversation early, preserve notification state
- **Multiple rapid clicks**: Prevent multiple conversations from starting simultaneously
- **Beat advancement mid-conversation**: Current event completes, then check for new unlocked events

## Code Structure

```typescript
// Story event completion handler (simplified)
player.onCompleted(async () => {
  if (currentEventIdRef.current) {
    const completedId = currentEventIdRef.current;
    
    // Mark event as completed
    setState((prevState) => {
      const completedEvents = [...(prevState.dialogue?.completedStoryEvents || []), completedId];
      return {
        ...prevState,
        dialogue: {
          ...prevState.dialogue,
          completedStoryEvents: completedEvents,
        },
      };
    });
    
    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if all unlocked events for current beat are done
    const currentBeat = state.storyProgress?.currentStoryBeat || 'hook';
    const allUnlockedEvents = dialogueManager.getAvailableStoryEvents(currentBeat);
    const completedEvents = state.dialogue?.completedStoryEvents || [];
    const remainingEvents = allUnlockedEvents.filter(id => !completedEvents.includes(id));
    
    if (remainingEvents.length === 0) {
      // All unlocked events done - clear notification
      clearNewDialogue();
    }
    // Otherwise, notification stays visible for remaining events
    
    // Clean up and end conversation
    currentEventIdRef.current = null;
    eventPlayerRef.current = null;
    dialogueQueueRef.current?.clear();
    setConversationActive(false);
  }
});

// Refactored handleStartConversation
const handleStartConversation = async () => {
  // Setup (wait for refs, etc.)
  // DON'T clear notification here
  
  // Get CURRENT story beat
  const currentBeat = state.storyProgress?.currentStoryBeat || 'hook'
  
  // Check for unlocked story events for current beat
  const completedEvents = state.dialogue?.completedStoryEvents || []
  const availableEvent = dialogueManager.getAvailableStoryEvent(currentBeat, completedEvents)
  
  if (availableEvent) {
    // Play ONE unlocked story event, then end
    // (existing player setup code)
    // Completion handler will check for remaining events and clear notification if needed
  } else {
    // Show banter (default state - no unlocked events)
    showBanter()
  }
}
```

## Testing Checklist

- [ ] Single unlocked story event plays correctly and ends conversation
- [ ] Multiple unlocked story events require separate clicks (one per event)
- [ ] Notification persists while unlocked story events remain
- [ ] Notification clears only after all unlocked events for current beat complete
- [ ] After all unlocked events done, clicking "Start a Conversation" shows banter
- [ ] Banter works correctly when no unlocked story events available
- [ ] When story beat advances, new events unlock and notification appears
- [ ] Only events for current story beat are considered (not future beats)
- [ ] Both systems handle pagination/chunking correctly
- [ ] State persists correctly across page refreshes
- [ ] User can end conversation early without breaking notification state