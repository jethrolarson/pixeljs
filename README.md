# Pixel Puzzle

A nonogram/picross-style puzzle game with multi-color support. Players solve pixel art puzzles by filling in cells based on colored number hints.

Live at **https://pixel-puzzle-with-friends.web.app**

## Stack

- **Vite** + **TypeScript** — build tooling
- **Canvas 2D API** — game rendering (replaced Processing.js)
- **Firebase Auth** — Google sign-in
- **Firestore** — level storage
- **Firebase Hosting** — deployment

## Dev setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

## Pages

- `/` — level browser
- `/edit.html` — level editor
- `/play.html?id=<levelId>` — play a level

## Deploy

```bash
npm run build
firebase deploy
```

## Firestore rules

Rules are in `firestore.rules`. Run the focused rules suite with JDK 21 or newer:

```bash
npm run test:rules
```

Deploy the containment rules before deploying the UI:

```bash
firebase deploy --only firestore:rules
npm run build
firebase deploy --only hosting
```

Pack voting UI and vote reads are disabled by default. A build made with
`VITE_ENABLE_VOTING=true` exposes the existing voting UI, but direct Firestore vote
writes remain intentionally denied until a trusted backend owns vote and aggregate
updates. Pack creation must assign ownership to the authenticated user. Owners retain
content editing and deletion; moderators retain featuring and deletion, while ownership,
featured state, vote totals, IDs, and creation timestamps are protected from owner edits.
