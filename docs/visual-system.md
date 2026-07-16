# 25Y Puzzle visual system

Implementation reference for the opening adventure, tutorial, map, mission board, card guide, rewards, parent guide, and settings. The visual goal is a warm tabletop adventure: tactile enough to invite play, calm enough to keep the current decision obvious.

## 1. Design principles

1. **One bright action per screen.** The primary action uses `--action-primary`; secondary tools stay quieter.
2. **Recognition before reading.** Every category has a stable icon, shape cue, label, and color. Never use color alone.
3. **A board game, not a worksheet.** Use layered paper, paths, stamps, cards, map landmarks, and tokens. Avoid ruled grids, grade marks, score tables, and dense panels.
4. **Playful, not noisy.** At most one large illustration, one animated focal element, and one emphasized action in the same viewport.
5. **Kind feedback.** Success is a discovery; an incomplete solution gently wiggles or highlights what can change. Never use red flashes, crosses, buzzers, or “failure” styling.
6. **Bilingual by construction.** Controls expand for Simplified Chinese and never depend on fixed English widths.

## 2. Color tokens and contrast

Use these exact starting tokens in `css/variables.css`. Text contrast targets are WCAG AA: 4.5:1 for normal text and 3:1 for text at least 24px regular or 18.66px bold, interface boundaries, icons, and focus indicators.

```css
:root {
  /* Foundations */
  --ink-strong: #17324d;
  --ink-muted: #52687d;
  --paper: #fffaf0;
  --paper-raised: #ffffff;
  --map-sand: #f7e7bb;
  --line: #b8c4cc;
  --shadow: rgba(23, 50, 77, 0.16);

  /* Actions and states */
  --action-primary: #1e5fa8;
  --action-primary-hover: #174c87;
  --action-primary-ink: #ffffff;
  --action-secondary: #e8f1f7;
  --focus: #0a67c7;
  --success: #176b4d;
  --success-soft: #dff4e8;
  --gentle-clue: #a8442f;
  --gentle-clue-soft: #fff0e8;

  /* Card categories */
  --number: #1e67b1;
  --number-soft: #e5f1ff;
  --puzzle: #6846a5;
  --puzzle-soft: #eee8fb;
  --mission: #8a5700;
  --mission-soft: #ffedb5;
  --strategy: #176b63;
  --strategy-soft: #dff4f0;
  --reward: #a3412f;
  --reward-soft: #ffe4dc;

  /* Map environments; decorative fills only */
  --forest: #6e9b62;
  --cave: #88709e;
  --river: #62a9c7;
  --mountain: #a58267;
  --camp: #d7923e;
}
```

Approved foreground/background pairs:

| Use | Foreground | Background | Requirement |
| --- | --- | --- | --- |
| Standard copy | `--ink-strong` | `--paper` or white | Normal text AA |
| Muted/supporting copy | `--ink-muted` | white | Normal text AA; do not use below 16px |
| Primary buttons | white | `--action-primary` | Normal text AA |
| Positive feedback | `--success` | `--success-soft` | Normal text AA |
| Gentle correction | `--gentle-clue` | `--gentle-clue-soft` | Normal text AA; pair with a clue icon and sentence |
| Category text/icons | category dark token | corresponding soft token | Normal text AA |

Rules:

- Environmental colors are illustrations, not text backgrounds. Put labels on opaque white or `--paper` plaques.
- Never place white type directly on yellow, light green, light blue, or map textures.
- Disabled controls retain readable labels and a visible boundary; use `opacity: .55` only on the whole control, never below `.45`.
- Selected cards add a dark outline, check token, and lift. Do not indicate selection by saturation alone.
- Mission feedback never recolors the entire screen.

## 3. Typography

Use a local/system stack; do not block play on a font download.

```css
:root {
  --font-display: ui-rounded, "Arial Rounded MT Bold", "Trebuchet MS", "Noto Sans SC", sans-serif;
  --font-body: "Trebuchet MS", "Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif;
  --text-xs: 0.875rem;
  --text-sm: 1rem;
  --text-md: 1.125rem;
  --text-lg: 1.375rem;
  --text-xl: clamp(1.75rem, 4vw, 2.5rem);
  --text-hero: clamp(2.5rem, 9vw, 5rem);
  --line-compact: 1.15;
  --line-body: 1.45;
}
```

- Display type is for the logo, target number, landmark titles, and reward names. Use weight 700–800.
- Body and button text use weight 600 minimum; parent-guide paragraphs may use 400–500.
- Mission instructions: 20–24px on mobile, 22–28px on larger screens, maximum two short lines.
- Card numerals: `clamp(2.5rem, 10vw, 4.75rem)`, tabular lining numbers, line-height 1.
- Buttons: 18px minimum, 20px for the main child action. Chinese buttons may wrap to two centered lines with at least 1.2 line-height.
- Avoid all caps. English labels use sentence case. Chinese copy receives normal tracking; never add letter spacing.
- Limit adult-facing prose to 60–70 characters per line and child-facing text to about 24 Latin characters or 12 Chinese characters per line where possible.

## 4. Geometry, elevation, and spacing

```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --radius-control: 0.875rem;
  --radius-card: 1.25rem;
  --radius-panel: 1.75rem;
  --stroke: 2px;
  --shadow-card: 0 5px 0 rgba(23, 50, 77, .16), 0 10px 24px rgba(23, 50, 77, .10);
  --shadow-lift: 0 8px 0 rgba(23, 50, 77, .16), 0 16px 30px rgba(23, 50, 77, .14);
}
```

- Base spatial unit is 4px; ordinary gaps use 8, 12, 16, 24, 32, or 48px.
- Cards are rounded rectangles, not pills. Buttons may be rounded rectangles; reserve pills for small status tags and progress counters.
- Surfaces use a 2px visible border plus a short, soft “tabletop” shadow. Avoid transparent glass panels.
- Interactive elements are at least 48 × 48px with 8px separation. Main actions are at least 56px high.
- Card aspect ratio is approximately 3:4. Minimum playable card width is 96px; comfortable mobile width is 112px; desktop is 132–152px.

## 5. Card appearance system

All cards share a stable anatomy:

1. **Category tab** at the top-left: icon plus localized category label.
2. **Primary content** in the center: numeral, visual pattern, mission symbol, action, or badge.
3. **Visual support** below: quantity dots/objects or one short description.
4. **Interaction marker** at the top-right: check token when selected, usage token for strategy cards, or discovery stamp for rewards.
5. **Accessible name** that announces category, value/action, and state.

Use a white or soft category surface, 2px category border, dark ink content, and one category-specific silhouette cue:

| Category | Color pair | Shape cue | Stable icon | Content treatment |
| --- | --- | --- | --- | --- |
| Number | blue / pale blue | Double rounded corner; small circular pips along lower edge | `#` or three dots | Huge numeral plus quantity dots arranged in familiar 5/10 frames |
| Puzzle | purple / pale lavender | Arched top inset | Interlocking puzzle piece | Large sequence/group graphic; no more than five items |
| Mission | ochre / pale gold | Notched “map ticket” top edge | Compass | Goal in one line; target in oversized central medallion |
| Strategy | teal / pale mint | Clipped upper-right corner | Four-point path fork | Verb-first action plus single-use token |
| Reward | rust / pale coral, with gold accent | Scalloped badge inside a rectangular collectible card | Star ribbon | Character/badge illustration and effort-based title |

Shape cues must be built with a border/pseudo-element or nested badge so the card keeps a large rectangular hit area. Do not use an extreme `clip-path` that clips focus rings or text.

### Number quantity layout

- Values 1–5 use a die-like arrangement; 6–10 use two five-frames; 11–20 use grouped tens plus remainder.
- Dots are at least 10px on mobile, with 6px clear space. Use one icon family per mission (stars, berries, stones), not mixed objects.
- The numeral remains present whenever visual quantities are enabled. Turning quantities off hides only the dot/object layer.
- Duplicate values need unique DOM IDs but identical visual value treatment.

### Card states

- **Resting:** normal border and `--shadow-card`.
- **Hover (pointer devices):** translate up 2px; do not require hover to reveal content.
- **Selected:** 4px `--ink-strong` outline, check badge with the localized accessible state, and translate up 6px.
- **Dragging:** scale to 1.03, rotate no more than 1 degree, lower shadow opacity; leave a visible placeholder.
- **Valid drop target:** solid focus-colored outline plus a downward arrow icon and “Place card” label.
- **Unavailable:** muted surface, lock/hourglass icon, readable reason for parent/assistive technology.
- **Discovered solution:** small stamp; previous solutions remain visible but subdued so another arrangement can be attempted.

## 6. Core components and screen motifs

### Buttons and tools

- Primary child action: blue filled button with a leading action icon. One per view.
- Secondary action: pale blue or white with dark border.
- Utility actions (hint, undo, reset, sound): 48px square or wider, always icon plus visible text on desktop; on narrow mobile, icon plus a short visible label below or beside it.
- Destructive reset-progress action is visually quiet until a confirmation panel opens. Use `--gentle-clue`, never alarming bright red.
- Language selector displays `EN` and `简体中文` as text, not flags.

### Opening screen

- Compose as an illustrated treasure map with a winding path from the title to the start button.
- Place three floating card silhouettes around, not over, the title or controls.
- Use one scout character waving toward the path. The character never blocks navigation.
- The tagline stays to one line where possible. “Start Adventure”/“开始冒险” is the strongest object after the title.

### Adventure map

- A dotted path connects three initial landmarks: Number Forest, Pattern Cave, and Shape River. Future destinations may appear as faint illustrated silhouettes with a lock and “Coming later” label.
- Current location: compass halo and gentle breathing ring. Completed: stamped star plus check. Available: full color. Locked: low-detail line art plus lock. These states use symbols and labels as well as color.
- Landmark buttons use at least a 72 × 72px visual marker inside a 96 × 96px hit area.
- Path progression is not a leaderboard; show “2 of 3 discoveries” beside a shared satchel or campfire.

### Mission board

- Treat the board as a tabletop with four clear regions: mission at top, solution tray in the center, hand of cards below, controls at the bottom/side.
- The solution tray has empty card slots only when a fixed count matters. Open-ended missions use one broad outlined tray.
- Keep the target number/visual at the center of the mission card and the primary confirm action close to the solution tray.
- Shared progress is a path with 3–5 discovery stones, not a percentage bar.
- A parent prompt appears as one optional speech-bubble card from the scout character. It must not modal-block the board.

### Tutorial

- Four illustrated panels use the same board objects as play: mission → cards → shared solution → reward.
- Show one sentence and one action per step. Keep Skip and Replay visually secondary.
- Progress uses four labeled dots with a visible current step number.

### Rewards

- Use a stamp-book or explorer satchel motif. Reward reveals may unfold from a small card into a badge.
- Badges celebrate action: teamwork, noticing, explaining, trying, or finding another solution. Avoid trophy cups, podiums, coins, rarity colors, or loot-box language.

### Character direction

Use one recurring non-gendered **star scout**: a small rounded five-point star with a tiny backpack and compass. Keep the face to two eyes and a simple mouth; emotional states are calm curiosity, encouragement, and delight. The scout acts as a guide, never a judge. Supporting environmental characters can be leaves, stones, fireflies, or river droplets with faces, but only one character speaks on a screen.

Illustrations use flat shapes, 2–3px dark-blue outlines, sparse paper-grain texture, and limited shading. Avoid photorealism, detailed facial features, cultural stereotypes, and emoji as production artwork.

## 7. Icon system

- Use a single custom inline SVG family: 24 × 24 viewBox, 2px rounded stroke, `currentColor`, filled accent only when it reinforces state.
- Icons must be simple enough to recognize at 20px and should match the dark-blue illustration outline.
- Stable mappings: compass = mission/map, hand/card = select, spark = hint, curved arrow = undo, circular arrow = reset, check = confirm/selected, speech bubbles = talk together, gear = settings, speaker = sound, flag = finish, eye = visual quantities.
- Never use an icon alone for an unfamiliar or high-consequence action. Every icon-only compact control needs a localized `aria-label` and tooltip; main child actions retain visible text.
- Do not use country flags for language, a red X for an attempt, or padlocks for completed content.

## 8. Responsive layout rules

Build mobile-first and test both languages at 320, 375, 768, 1024, and 1440 CSS pixels.

### Compact phones: 320–479px

- Page padding: 12px; panel padding: 16px; gap: 12px.
- Use one column. Header includes logo plus settings/language, with nonessential labels moved into the settings sheet.
- Mission card is full width. Solution tray follows immediately. Card hand is a horizontally scrollable snap row with partial next-card visibility; provide previous/next buttons for keyboard users.
- Bottom controls wrap into two rows. Confirm is full width and last in visual order; utility buttons are equal-width above it.
- No horizontal page overflow. Only the explicitly labeled card rail may scroll horizontally.
- Settings and card guide use full-height sheets with a visible close button and trapped focus when modal.

### Large phones and tablets: 480–899px

- Page padding: 20–24px; card hand may use a 3–4 column grid or snap rail depending on card count.
- Mission and progress share the top row when space allows; solution stays centered.
- Adventure map uses a gentle vertical S-path in portrait and a horizontal path in landscape.

### Desktop: 900px and above

- Content max-width: 1180px; page padding: 32px.
- Mission board uses a 3-column grid: mission/progress (minmax 220, 0.8fr), solution and hand (minmax 480, 1.7fr), tools/parent prompt (minmax 200, 0.7fr).
- Keep the card hand at 4–6 visible cards per row. Do not shrink cards below 112px to fit more.
- Map may use a wide winding path. Keep every landmark within keyboard-visible viewport padding.

### Height and orientation

- At viewport heights below 650px, reduce decorative illustration size before reducing controls or card content.
- Support landscape tablets without hiding the confirm button; use a sticky tool rail only if it does not cover the card hand.
- Use logical properties (`margin-inline`, `padding-block`) and flexible widths. Do not hardcode widths from English labels.

## 9. Motion and feedback

Motion communicates cause and effect, not spectacle.

```css
:root {
  --duration-fast: 120ms;
  --duration-base: 220ms;
  --duration-celebrate: 420ms;
  --ease-out: cubic-bezier(.2, .8, .2, 1);
  --ease-place: cubic-bezier(.2, .9, .3, 1.15);
}
```

- **Card pick/place:** 120–220ms lift and settle. Maintain spatial continuity between hand and tray.
- **Valid solution:** 420ms maximum—cards settle, path spark travels once, reward stamp appears. No confetti storm or repeated flashing.
- **Try changing a card:** one 4px horizontal nudge over 220ms plus a warm outline and specific clue. Never shake the whole board.
- **Map idle motion:** one firefly drift, flag flutter, or compass pulse at a time; 6–10s loops with pauses.
- **Screen changes:** 220ms fade/slide no more than 16px. Do not animate large parallax backgrounds.
- Pause decorative animation when the document is hidden.
- Sound hooks may align with place, discovery, and reward; never autoplay on load and always honor mute.

Reduced motion must be available both from settings and the OS preference:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

Application setting `data-motion="reduced"` should apply the same behavior. Reduced motion keeps state changes visible through outlines, check tokens, text feedback, and static reward stamps.

## 10. Focus, keyboard, touch, and assistive states

```css
:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 4px;
}

.card[aria-selected="true"]:focus-visible {
  outline: 4px solid var(--ink-strong);
  box-shadow: 0 0 0 7px var(--paper-raised), 0 0 0 10px var(--focus);
}
```

- Never suppress focus outlines. Ensure shadows and overflow containers do not clip them.
- Focus order follows the task: mission → available cards → solution tray → confirm → utilities → parent prompt.
- Cards are buttons or keyboard-operable listbox options. Space/Enter selects; a second activation or tray activation places; Escape cancels a drag/selection.
- Dragging is optional. Pointer targets, drop zones, and card controls meet the 48px minimum.
- Feedback uses an `aria-live="polite"` region and remains visually present until the next meaningful action.
- Modal sheets return focus to their opener. No child can be trapped: every sheet has a visible close action, and every mission exposes map/finish after completion.
- Tooltips do not contain essential instructions and can be opened by keyboard/focus as well as hover.

## 11. Density and content limits

- Opening: title, one tagline, two actions, settings/language.
- Map: three active destinations in the initial prototype, one short progress statement.
- Mission board: one mission instruction, 4–8 available cards at once, no more than four utility tools visible before an overflow/settings sheet.
- Parent prompt: exactly one prompt at a time.
- Feedback: one headline plus one short next-step sentence.
- Settings: group into Language, Play, and Comfort; use switches/selectors with short supporting text only where consequences are unclear.

## 12. Implementation acceptance checklist

- [ ] Every category is identifiable in grayscale by icon, label, and shape cue.
- [ ] Text/background pairs meet AA; interface and focus boundaries meet 3:1.
- [ ] Controls are at least 48 × 48px and the primary action is at least 56px high.
- [ ] Card selection has outline, check token, lift, accessible state, and color reinforcement.
- [ ] English and Simplified Chinese fit at 200% zoom without truncation or horizontal page scrolling.
- [ ] The 320px layout keeps mission, tray, hand, and confirm usable.
- [ ] Keyboard users can select/place every card without dragging.
- [ ] Reduced motion removes all decorative loops and movement while preserving state feedback.
- [ ] No screen uses more than one speaking character or more than one primary action.
- [ ] Illustrations never cover labels, focus rings, hit targets, or live feedback.
- [ ] Feedback is positive, specific, persistent enough to read, and never punitive.
- [ ] Map and reward visuals communicate shared discovery rather than scores, ranks, or scarcity.
