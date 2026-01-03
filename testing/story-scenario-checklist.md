# Story/Narrative Scenario Checklist

Purpose: Quick regression pass for Book of Passage blurbs, story event order, and notifications.

## Scenario 1: Game Start Blurb
- Start a new game.
- Verify the blurb "The Book of Passage" is unlocked in Book of Passage.
- Verify the Book of Passage notification highlights any relevant navigation button until visited.

## Scenario 2: First Kethaneum Unlock
- Unlock the first Kethaneum book.
- Verify the blurb "The Kethaneum's Pull" is unlocked.
- Verify notification glow appears on Book of Passage navigation button(s) before visiting.

## Scenario 3: Story Event Ordering - Event 1
- Unlock story event 1; verify the blurb "Test after event 1" is NOT present yet.
- Complete story event 2.
- Verify the blurb "Test after event 1" is present (config order 4 should appear before order 3).

## Scenario 4: Story Event Ordering - Event 2
- Unlock story event 2; verify the blurb "Test after event 2" is NOT present yet.
- Complete story event 2.
- Verify the blurb "Test after event 2" is present (config order 3).

Notes:
- Record any missing notification glow or out-of-order blurb behavior.
- If a notification is missed, capture logs and the current save state.
