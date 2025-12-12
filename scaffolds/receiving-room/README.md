Receiving Room scaffold — installation instructions

This scaffold contains a self-contained, UI-only Receiving Room implementation you can copy into your project.

What to copy and where
- Copy the files into your project's `app/receiving-room/` folder (create the folder if it doesn't exist):
  - page.tsx                    → app/receiving-room/page.tsx
  - CosmicBackground.tsx        → app/receiving-room/CosmicBackground.tsx
  - FormattedSegment.tsx        → app/receiving-room/FormattedSegment.tsx
  - ActionButton.tsx            → app/receiving-room/ActionButton.tsx
  - receiving-room.module.css   → app/receiving-room/receiving-room.module.css
  - index.test.tsx (optional)   → app/receiving-room/index.test.tsx

Constraints and notes
- These components are UI-only. They must NOT read or write game save state or mutate `lib/game/state`.
- If you later need to persist visit/discovery flags, add a dedicated handler and follow the save-layer rules (convert Sets → arrays, merge discovered arrays, never persist derived `bookPartsMap`).
- After copying files, run `npm run dev` and open `/receiving-room` to verify.

If you want, I can commit these scaffolds on a new branch for you to cherry-pick. Otherwise, copy the files into `app/receiving-room/` and I can help wire them to real content or assets.