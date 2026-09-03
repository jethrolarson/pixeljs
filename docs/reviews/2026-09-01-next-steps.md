# PixelJS: recommended next steps

_Review date: 2026-09-01. Decision aid, not a committed roadmap._

## Executive recommendation

PixelJS already has a distinctive, playable color-nonogram core, unusually good keyboard support, a coherent terminal presentation, responsive canvas work, packs, spoiler-free rewards, and a complete browser-based authoring path. The human reports experience holes from playtesting, so after immediate trust containment the next phase should prioritize the **player experience and content ramp**, not broad platform hardening.

The highest-value sequence is:

1. **Contain live trust failures now** — validate ownership on create, protect privileged/aggregate fields, deny vote-subdocument writes in Firestore rules, and hide/disable broken voting. Keep that backend denial until an authorization-safe vote path ships. If the other minimum rules are deferred, restrict publishing/authoring to trusted users in the meantime.
2. **Reproduce reported playtest problems and prototype the curriculum** with a few small puzzles; this informs both UI fixes and the longer ramp.
3. **Protect authored work before scaling production** — gate Pack Edit load/save states and cap/validate the current single-character palette encoding.
4. **Build the long intuition ramp** — use many small puzzles that each exercise a specific deduction or interaction, increasing complexity slowly rather than asking a short tutorial to explain the game.
5. **Make the journey continuous and add narrow regression coverage** around the puzzle, persistence, and input behavior that the ramp depends on.

Broader vote architecture, moderation, and scale hardening remain a later community-growth gate; minimum containment does not.

## Evidence and review boundaries

### Observed

- Production build succeeds (`npm run build`): 119 modules, largest shared JS chunk 341.78 kB / 106.07 kB gzip; build took about 1 s locally.
- There are no test files, test/lint scripts, or CI workflows. The only package scripts are `dev`, `build`, and `preview` (`package.json`).
- `npm audit --omit=dev` reports one moderate `protobufjs` denial-of-service advisory with a fix available.
- The public production database had **2 published packs and 9 total linked levels** at review time: an 8-level featured “Tutorial” (including 3×3, 10×10, and 7×12 puzzles; one is two-color) and a one-level “A Mystery.” This was observed through the same public Firestore API the product uses; it is a point-in-time content count, not usage data.
- The app records signed-in solved status, but not guest solves or in-progress grids (`src/Views/Play.ts`, `src/store.ts`). Pack-page thumbnails use persisted solved status, while the in-game pack picker initializes every item to unsolved each session (`src/Views/Pack.ts:104-119`, `src/Views/Play.ts:70-82`).
- Play is a full-screen canvas. It has mouse/touch and substantial keyboard controls, a `?` guide, a touch mark tool, color switching, pack navigation, native pinch zoom, and responsive/DPR-aware rendering (`src/game/input.ts`, `src/game/loop.ts`, `src/game/term/help.ts`). HTML pages have viewport and titles but no descriptions, social metadata, manifest, sitemap, or dedicated not-found handling.
- Play constructs a mute state but exposes no mute control; sound is on by default after interaction (`src/Views/Play.ts`, `src/game/loop.ts`). Animation runs continuously via `requestAnimationFrame`, recomputing hints/satisfaction and redrawing the viewport even while idle (`src/game/loop.ts:283-532`).
- Palette entries are encoded as single characters in `LevelData.game`, but the editor can add colors without a cap. Color index 10 serializes as two characters and will not round-trip through `game.split('')` (`src/level.ts`, `src/components/Palette.ts`).
- Pack editing renders an enabled blank form before its asynchronous pack/level load completes. `currentId` is already the requested pack ID, so a fast Save can merge blank/default data into an existing owned pack. Save/delete/navigation errors are generally console-only, and there is no dirty-state warning (`src/Views/PackEdit.ts`).
- `getLevels()` downloads all public levels ordered by update time, then Pack Edit filters to the current owner in the browser (`src/store.ts:20-23`, `src/Views/PackEdit.ts:328`).
- Firestore rules allow a pack owner to update any pack field. Therefore an owner or direct API client can set their own `featured`, `featuredOrder`, or `upvotes`; the moderator-only diff restriction applies only to the moderator branch. Create rules do not require `ownerId == request.auth.uid` or validate shapes/limits (`firestore.rules`).
- **Ordinary non-owner voting is currently authorization-broken:** the voter may create/delete their own `/packs/{packId}/upvotes/{userId}` document, but the subsequent parent-pack `updateDoc(... increment(...))` is denied because they are neither pack owner nor moderator (`firestore.rules`, `src/packStore.ts:75-87`). The two writes are separate, so the vote document can change before the aggregate fails. The UI rolls back optimistically, leaving vote documents, displayed state after reload, and `packs.upvotes` inconsistent. Pack owners can complete the parent update only because the overly broad owner rule permits it.
- Recent history is concentrated on terminal styling, packs, keyboard controls, mobile layout, and several touch regressions/fixes. That demonstrates active UX investment but also identifies input as a regression-prone boundary.
- README page documentation only lists `/`, `/edit.html`, and `/play.html`, while the build now has eight entry pages.

### Human playtest and product input

The human’s test notes in `docs/human_ideas.md` identify concrete experience holes: unreliable hint-completion indication, phone text scaling to near-unreadability, unintuitive game back navigation, weak unsolved-puzzle placeholders, unclear palette/eraser affordances, and crowded account/admin navigation. They also call for a much longer simple-puzzle ramp, curated authoring palettes, moving puzzles between packs, and a product decision on optional hints/error checks. These reports should outrank speculative polish; each still needs a reproducible case or acceptance example before implementation.

### Inference (validate with people or telemetry)

- The tiny public catalog, lack of usage analytics, and tutorial-heavy inventory suggest content depth—not rendering performance—is the present growth ceiling.
- Losing guest/in-progress state likely harms completion more than missing advanced modes, especially on mobile, but no funnel data currently quantifies this.
- Ease of interaction is the relevant accessibility opportunity for this visual 2D puzzle: color-only clues may burden color-vision-deficient players, while persistent audio/motion preferences, forgiving touch targets, zoom, and complete keyboard operation can reduce avoidable barriers.
- The 106 kB gzip shared bundle and continuous redraw are worth measuring on low-end phones, but current puzzle sizes cap at 32×32 and there is no observed performance failure. Optimize only after profiling.

## Prioritized opportunities

| Priority | Opportunity | Expected value | Effort / risk | Dependencies |
|---|---|---|---|---|
| **P0-now** | **Contain already-live untrusted writes.** Require pack/level creates to set `ownerId == request.auth.uid`; require safe defaults for privileged/aggregate pack fields on create; prevent owners from later changing ownership, featured/moderator fields, or aggregate vote counts. Temporarily deny vote-subdocument creates/deletes in Firestore rules (not only the UI) and hide/disable voting until an authorization-safe implementation ships. Alternatively, temporarily restrict publishing and authoring to explicitly trusted users. Add emulator cases proving direct authenticated vote-subdocument writes are denied. | Stops new self-promotion, fabricated aggregates, spoofed ownership, and partial votes without making broad hardening the product focus. | **S–M**, rule deployment risk; inspect current clients/documents before tightening. | Choose open-with-minimum-rules versus temporarily trusted-only creation. |
| **P0** | **Reproduce reported core feedback/readability problems.** The human reports incorrect clue/hint completion and near-unreadable phone scaling; capture minimal states/devices before treating either as an independently confirmed defect. If reproduced, correct them and add regression cases. Also validate reported Back-navigation, unsolved-placeholder, and color/erase/mark affordance problems on phone and desktop. | Prevents solving the wrong semantics while prioritizing the reported failures most likely to undermine a learning ramp. | **M** overall; clue semantics and responsive layout carry regression risk. Split by reproducible failure. | Decide intended clue-completion semantics and Back behavior for pack entry versus direct/shared links. |
| **P0** | **Protect authoring before substantial catalog production.** Gate Pack Edit on load success, disable save during load/save, surface retryable errors, validate before publish, and guard unsaved navigation. Cap palettes at 9 immediately or migrate `game` to an unambiguous encoding, and validate the serialized grid shape. | Prevents losing or corrupting an M–L content investment. These failure modes were independently identified in source inspection. | **S–M**. Encoding migration becomes **L** if >9 colors are desired. | Decide maximum palette and orphan-level ownership/lifecycle policy. A tiny curriculum prototype may precede this; production should not. |
| **P0/P1** | **Prototype, then build a long puzzle-led learning ramp.** First test a handful of small teaching puzzles. After authoring safeguards, produce a substantial sequence where each level isolates or recombines a deduction: basic runs and blank space, overlap/edge reasoning, separated runs, marking known-empty cells, then color selection, same-color separation, adjacent different-color runs, and gradually larger combinations. | Directly addresses the content and comprehension ceiling while producing real play material. Small focused puzzles make difficulty tunable and reveal which interactions need UI support. | Prototype **S**; production **M–L** content/design effort. Pacing requires repeated playtesting. | Human playtest list determines the curriculum; substantial production depends on authoring protection. |
| **P1** | **Make progress coherent.** Hydrate the pack picker from persisted solves; store anonymous solved and in-progress state locally; optionally merge it after sign-in; restore per-level paint/marks after reload; make “next puzzle” unmistakable on win. | Keeps a long ramp from feeling disposable or fragile. Fixes the independently observed contradiction between pack page and in-session solved indicators. | **M**. Merge semantics and storage versioning need care. | Human decision: account-first vs guest-first product, and whether mistakes/elapsed time matter. |
| **P1** | **Establish a focused safety net.** Add a test runner and CI build. Start with `Level` round trips/hints/completion, clue satisfaction, palette removal, layout bounds, pointer state transitions, pack pagination/request races, and progress persistence. Add a handful of browser smoke flows at mobile + desktop sizes. | Protects the content ramp and the input/progress fixes most likely to regress. | **M**, low product risk. Pointer timing should be extracted behind injected clock/scheduler rather than tested as flaky real time. | Stable expectations from the current experience pass. |
| **Later gate** | **Before re-enabling/promoting community voting, finish the trust architecture.** Move vote + aggregate maintenance to an authorization-safe design (for example a trusted backend trigger/function, or count vote documents at read time where scale permits)—a client transaction alone cannot grant parent-update permission. Reconcile existing vote documents against every stored count; then cover ordinary voter, owner, moderator, failure, and retry paths. Add broader moderation/validation/scaling work when untrusted community volume warrants it. | Restores a meaningful community signal and supports growth beyond minimum containment. | **M**, migration/deployment risk. Existing vote documents/counts need repair. | Complete minimum containment first; re-enable voting only after reconciliation and end-to-end authorization tests. |
| **P2** | **Inclusive interaction pass.** Add visible/persistent mute and reduced-motion preferences; audit touch target size, gesture discoverability, focus indicators, keyboard parity, zoom/reflow, and contrast; provide redundant color identifiers or selectable patterns where they remain legible. Test the actual puzzle flow with players who have color-vision or motor/access needs. | Makes the visual puzzle easier to enter and operate across devices and input methods. | **M** and should be user-tested; pattern design must preserve clue/grid readability. | Human decision on supported input/device baseline and which color/motor needs to prioritize. |
| **P2** | **Shape authoring around the content plan.** Offer curated palette sets (for example a crayon box) instead of making every color choice open-ended; evaluate character/pattern identifiers as an optional terminal-style aid; allow owned puzzles to move between packs; replace global `getLevels()` with an owner query; and clarify orphan/delete behavior. Add deeper drafts/history only if content production demonstrates the need. | Speeds coherent level production and removes current organizational dead ends without overbuilding a general creator platform. | Palette presets/query **S–M**; moving levels and lifecycle rules **M**. | Palette-size/encoding decision; whether reuse means move, copy, or multi-pack linking. |
| **P3** | **Distribution after retention evidence.** Add accurate README/routes, metadata/favicon/robots/sitemap, share affordances, and stable human-readable pack landing URLs. Dynamic per-pack social cards/metadata likely require hosting or rendering changes. | Improves credibility and sharing, but static metadata alone will not compensate for nine public levels or unknown retention. | Basics **S**; dynamic landing metadata **M–L**. | A content cadence and evidence that players finish/share packs. |
| **Measure** | **Profile before performance work.** Capture load/LCP and frame time on a low-end mobile profile and a 32×32 multicolor puzzle. Then consider lazy Firebase/auth loading, audio preload policy, dirty-frame rendering, and cached hints. | Avoids speculative optimization while providing a threshold for action. | **S** to measure, implementation variable. | Representative device and performance budget. |

## Practical sequence

### 1. Contain live trust failures

- Validate ownership and safe privileged/aggregate defaults on create; protect ownership, featured, moderator-controlled, and aggregate fields on update; add focused emulator cases.
- Deny vote-subdocument creates/deletes at the Firestore rules/backend boundary and hide/disable the voting UI. Keep the backend denial until an authorization-safe vote implementation ships; UI hiding alone does not contain direct authenticated writes.
- If the remaining minimum write rules cannot ship promptly, restrict publishing/authoring to trusted users.

**Exit condition:** new untrusted writes cannot spoof ownership, self-promote, fabricate counts, or create partial votes, and direct authenticated vote-subdocument creates/deletes are rejected while voting is disabled.

### 2. Reproduce experience reports and prototype the curriculum

- Convert each `docs/human_ideas.md` report into a reproducible state/device and expected behavior; do not label reported clue/readability issues as independently reproduced until checked.
- Fix confirmed blockers needed for valid curriculum testing.
- Build only a small set of teaching puzzles initially; use them to test level sequencing and determine which gaps need UI versus content.

**Exit condition:** reported blockers have reproductions or are explicitly unresolved, and a tiny teaching sequence validates the curriculum approach.

### 3. Protect authoring, then scale the ramp

- Gate Pack Edit load/save phases and surface failures.
- Cap/validate the palette and serialized grid, or migrate the encoding.
- Then produce and repeatedly playtest the substantial small-puzzle progression.
- Add progress continuity and focused domain/progress/input tests alongside behavior that the ramp depends on.

**Exit condition:** authors can expand the catalog without avoidable loss/corruption, and players can understand, continue, leave, and resume the ramp.

### 4. Complete community hardening when needed

- Before re-enabling/promoting voting, choose an authorization-safe aggregate and reconcile existing vote documents/counts.
- Add broader moderation and scaling controls before inviting meaningful untrusted community volume.

**Exit condition:** an ordinary non-owner can vote without partial state, stored counts match vote documents, and promoted community features have tested authorization boundaries.

### 5. Choose a growth direction from evidence

After observing learning-ramp start/solve/pack-completion and creator publish behavior, pick one:

- **Player/content bet:** commission/author a larger curated progression with difficulty metadata and accessibility options.
- **Creator/community bet:** improve reuse, drafts, moderation, and discovery so others can safely supply content.
- **Inclusive-interaction bet:** deepen color-redundant clues, adaptable feedback, and motor-friendly controls based on usability testing.

Do not build all three simultaneously; the current catalog and lack of funnel evidence cannot justify that breadth.

## Quick wins worth bundling with the above

1. Give unsolved puzzle cards a deliberate non-spoiler placeholder.
2. Make Back pack-aware and seed pack-picker solved flags from existing solves.
3. Add a visible mute toggle and persist mute/reduced-motion preferences.
4. Disable Pack Edit actions until load completes and show save failures in-page/toast.
5. Cap palette additions at the chosen encoding limit and validate `game.length == x * y`.
6. Add retry actions to load failures rather than console-only errors.
7. Move logout/admin behind a compact profile or menu treatment after checking mobile navigation space.

These are quick only when attached to the relevant experience/content work; isolated cleanup should not displace the learning ramp or reported playtest holes.

## Questions requiring human product judgment

1. Is PixelJS primarily a personal art toy, a curated puzzle game, or a community platform? Security, moderation, and authoring depth differ materially.
2. Should anonymous players have durable local progress, and should it merge into an account after Google sign-in?
3. Is nine colors an acceptable creative constraint, or must the storage format support larger palettes?
4. Can creators reuse another creator’s level in a pack? What should happen to levels when removed from or orphaned by a deleted pack?
5. Should zen remain the default/only play model, or should a player-requested hint/error-check system exist? What information may it reveal without replacing deduction?
6. Should authoring colors come from fixed curated sets, allow custom colors as an advanced escape hatch, or remain fully open-ended? Should glyphs/patterns redundantly identify colors?
7. When “moving” a puzzle between packs, is it exclusive movement, copying, or linking the same level into multiple packs?
8. Which interaction barriers should be prioritized beyond the existing mouse, touch, keyboard, and pinch-zoom support—for example color vision, motor precision, motion, or audio preferences?
9. What is a successful near-term session: advancing through the learning ramp, completing one pack, creating a pack, or sharing one? That determines the minimal analytics funnel and next content investment.

## Checks performed

- Inspected source, docs, HTML entries, Firestore rules/indexes, package scripts, git history/state, and current public production documents.
- Ran `npm run build` successfully.
- Ran `npm audit --omit=dev`; it exited nonzero for the one moderate `protobufjs` advisory noted above.
- No repository files were changed except this review artifact; pre-existing unrelated work was left untouched.
