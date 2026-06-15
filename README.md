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

Rules are in `firestore.rules`. Deploy separately with:

```bash
firebase deploy --only firestore:rules
```

Levels are publicly readable. Creating requires auth. Updating/deleting requires ownership.
