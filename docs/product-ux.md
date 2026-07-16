# 25Y Puzzle — Product and Child UX Specification

## 1. Experience principles

- Audience: a child aged 5–6 and one nearby adult, sharing one device.
- Promise: **“We explore numbers together.”** The child makes choices; the adult notices, asks, and celebrates.
- Every child-facing screen has one visually dominant action. Secondary actions are smaller but always reachable.
- Show before telling: use a card movement, highlight, or example before a sentence.
- Keep visible child instructions to one thought, ideally 2–6 words in English and one short line in Chinese.
- Present no more than 5 actionable choices at once, except the card hand (maximum 6 cards on mobile, 8 on larger screens).
- No timers, scores, streak loss, rankings, punitive sounds, or “wrong/failed” language.
- A session is a flexible chain of 3–5 missions (about 15–30 minutes), but children may return to the map after any completed mission.

## 2. Primary user journey

1. **Opening (first 10 seconds):** child sees the title, moving map, and number cards; taps **Start Adventure**.
2. **Choose support (first visit only):** adult/child picks Explorer, Pathfinder, or Adventure Master; Explorer is preselected. This is not an ability test and can change later.
3. **Visual tutorial (under 60 seconds):** four interactive beats: see mission → see cards → place cards together → reveal reward. The child performs one sample placement. Skip is always visible.
4. **Adventure map:** child chooses one of three visually distinct destinations. Only the recommended next stop pulses gently; completed places stay replayable.
5. **Mission board:** child explores a hand, places cards, and taps **Try This Solution**. The adult can open one optional conversation prompt.
6. **Feedback:** a valid solution produces brief celebration and either **Find Another Way** (when meaningful) or **Next Mission**. An incomplete attempt leaves cards in place and suggests one small change.
7. **Reward moment:** after 3–5 missions, the shared party receives one effort/teamwork badge, then chooses **Keep Exploring** or **Finish Adventure**.
8. **Session finish:** show the visited path and earned badge, with **Back to Map** as the primary action. Progress saves locally without sign-in.

Returning users go Opening → Continue Adventure → Map. Tutorial, difficulty, language, and settings remain available without resetting progress.

## 3. Navigation and screen structure

Use a small state-based router. Only one primary screen is visible at a time; overlays are reserved for settings, parent prompts, and confirm-reset.

| Screen | Child sees | Primary action | Secondary/escape actions |
|---|---|---|---|
| Opening | Logo, explorer character, 3 floating cards, short tagline, map path | Start/Continue Adventure | How to Play; Settings/Language |
| Difficulty choice | Three large illustrated trail cards; one-line support description | Choose Trail | Back; settings |
| Tutorial (4 beats) | One demonstration, one short line, progress dots | Try/Next | Skip; Back; replay audio hook |
| Adventure map | 3 destinations, party marker, collected badges, progress trail | Choose a destination | Rewards; Card Guide; Parent Guide; Settings; Finish |
| Mission board | Mission card, target, solution tray, card hand, progress pips | Try This Solution | Hint; Undo; Reset; Talk Together; Map |
| Success / another way | Built solution remains visible; celebration; solution counter | Find Another Way or Next Mission | Explain Together; Map/Finish |
| Reward reveal | One large badge and short reason it was earned | Add to Collection | Continue; Finish |
| Reward collection | Badge grid with earned/unearned silhouettes | Back to Map | Select badge for short detail |
| Card guide | Category tabs shown as icons/shapes; example cards | Back to Map | Tap card to see animated use |
| Parent guide | 3 scannable cards: Follow, Ask, Celebrate | Back to Adventure | Product explanation; sound-ready read-aloud hook |
| Adult product info | Short visual overview of skills and cooperative play; no effectiveness claims | Start/Continue Adventure | Parent Guide; Back |
| Settings overlay | Language, difficulty, sound, motion, quantity visuals | Done | Replay Tutorial; Reset Progress (with confirmation) |
| Session finish | Route recap, missions explored, teamwork badge | Back to Map | Replay a mission; close to Opening |

### Destination model for the prototype

- **Number Forest / 数字森林:** target totals, comparison, open-ended totals.
- **Pattern Cave / 规律洞穴:** visual patterns and classification.
- **Shape River / 图形河流:** quantity matching and simple shape/pattern puzzles.
- A location can be “new,” “current,” or “explored.” Do not show padlocks. Future locations appear as misty landmarks labeled “Coming later” only if they are not clickable.
- Map progress is a traveled path, not a percentage or grade.

## 4. Visual onboarding flow

Each beat occupies the same layout: illustration above, one sentence, one large action below. Do not auto-advance.

| Beat | Visual demonstration | English child copy | Simplified Chinese child copy | Action |
|---|---|---|---|---|
| 1 | Mission card flips to reveal target 10 | See our mission. | 看看任务。 | Next / 下一步 |
| 2 | Hand fans out; useful cards glow once | Look at our cards. | 看看我们的卡片。 | Next / 下一步 |
| 3 | 6 and 4 move into the tray; child places the 4 | Build it together! | 一起拼一拼！ | Place Card / 放入卡片 |
| 4 | Path lights up and teamwork badge appears | We found a way! | 我们找到方法啦！ | Start / 开始 |

If the sample card is not placed after a short period, gently wiggle the destination tray once; never take control away. After completion, save `tutorialCompleted`. Replay uses the same flow.

## 5. Mission game flow

1. Enter with a 700–1200 ms mission reveal (instant when reduced motion is active).
2. Show target first, then the hand. Keep mission instruction visible throughout.
3. Select cards by either drag-and-drop or tap → tap solution tray. A second tap on a selected card removes it. Keyboard uses Tab, Enter/Space to select, then Enter/Space on tray to place.
4. Update a live visual expression as cards enter the tray (for example `6 + 4`) and pair numerals with quantity dots when enabled.
5. Enable **Try This Solution** only when the mission’s minimum requirements are met. Explain disabled state in an accessible description, not only by appearance.
6. On confirm:
   - **Valid:** keep the solution visible, light one path step, name what worked, and store the normalized solution.
   - **Another valid solution required:** show first solution as a small “discovered” tile, reset only the tray, and ask for a different way.
   - **Not yet valid:** preserve selections, use a calm nudge such as “Try changing one card,” and optionally highlight the target—not an answer card.
7. Offer **Next Mission** after success. Always include **Map / Finish** so no child is trapped.
8. After the destination’s planned 3–5 missions, reveal one cooperative reward and return to the map.

### Mission-specific interaction patterns

- **Target/open-ended total:** move number cards into one solution tray; show plus symbols automatically.
- **Multiple solutions:** discovered solutions remain as small card-pair snapshots; duplicate combinations receive “We found that way already—let’s change one card.”
- **Comparison:** two large groups appear; child taps a group/card. Selection uses an outline plus check symbol.
- **Pattern:** sequence slots remain at top with one `?` slot; child places one candidate card into it.
- **Classification:** child taps all matching cards; selected cards collect into a clearly labeled group basket.
- Never require a child to type a number or sentence.

### Hint ladder

Hints are optional and never reduce rewards. One hint button advances at most three levels:

1. Restate visually (pulse target or relevant slot).
2. Narrow attention (“Look at these two cards”) without placing them.
3. Demonstrate one step, leaving the final choice to the child.

If mission data is invalid or no solution exists in the current hand, offer a friendly automatic card swap: “These cards need a new friend.” This is recovery, not a spent strategy card.

## 6. Child interaction rules

- Minimum target size: 48 × 48 CSS px; preferred cards at least 72 × 96 px on phones and 96 × 128 px on larger screens.
- Make the entire visible card clickable. Never place tiny controls inside a card.
- One card movement per action; avoid multi-finger gestures, long press, hover-only help, and precise dragging.
- Every interaction has immediate feedback: press depth, selection outline/check, destination glow, and optional soft sound.
- Selected state must use at least three cues: position/scale, border or symbol, and color.
- Preserve the child’s work after a gentle correction, opening a prompt, changing language, or rotating the device.
- Undo reverses exactly one action. Reset clears only the current attempt after a simple confirm; it does not reset the mission or progress.
- Difficulty changes apply at the next mission unless the user explicitly chooses “Start this mission again.”
- Do not automatically open modals, parent prompts, or settings during play.
- Keep animation short and purposeful: 150–300 ms interaction feedback; celebration under 2 seconds; never flash.
- Use consistent spatial meaning: mission at top, shared work in center, available choices at bottom, progress at upper edge.

## 7. Parent-child cooperative model

The device addresses the pair as **“we”** during play. The adult is a thinking partner, not a verifier.

- A small **Talk Together / 一起讨论** button opens one prompt card from a context-aware pool. It never opens automatically.
- Prompt overlay leaves the board visible, uses one question, and has one action: **Back to Cards**.
- Rotate prompts without repeating the previous prompt. Prefer observation before explanation: “What do you notice?” → “How did you choose?” → “Can we find another way?”
- After a valid solution, optionally show **Explain Together**; activating it can contribute to a teamwork reward but is never required or assessed by the device.
- Parent guide behaviors:
  1. **Follow:** let the child touch and choose first.
  2. **Ask:** use one open question, then wait.
  3. **Celebrate:** name the idea or teamwork, not speed or innate ability.
- Do not create separate parent/child accounts, roles, scores, or PIN-gated areas. Potentially destructive settings use a plain adult confirmation with hold-to-confirm or a simple two-step dialog, not a reading test for the child.

## 8. Feedback and reward rules

- Feedback names the observed strategy: “You made 10 with 6 and 4!” or “You noticed the pattern!”
- Use “That works,” “We found a way,” and “Try changing one card.” Never use wrong, fail, mistake count, red X, sad character, buzzer, or screen shake.
- Valid solutions animate the placed cards into the path/reward metaphor; invalid attempts use no loss animation.
- Rewards recognize process: Creative Thinker, Pattern Explorer, Team Helper, Number Builder, Brave Guesser, Multiple-Solution Finder.
- A badge reason is generated from actual session events (another solution found, hint tried, parent prompt opened, pattern solved), not random praise.
- Award at most one featured badge per short destination run. All earned badges remain viewable and have no rarity tiers.

## 9. Component inventory

### Global/navigation

- `AppShell`, `ScreenHeader`, `BackButton`, `SettingsButton`, `LanguageToggle`, `PrimaryButton`, `IconButton`, `Modal/BottomSheet`, `ToastLiveRegion`, `OfflineAssetFallback`.

### Adventure

- `OpeningHero`, `ExplorerCharacter`, `FloatingCardCluster`, `AdventurePath`, `DestinationMarker`, `PartyMarker`, `MissionProgressPips`, `SessionRecap`.

### Cards and game board

- `Card` variants: number, puzzle, mission, strategy, reward.
- `NumberCard` with numeral + optional quantity objects; `CardHand`; `SolutionTray`; `SequenceSlot`; `GroupBasket`; `DiscoveredSolutionTile`; `TargetDisplay`; `MissionInstruction`; `StrategyAction`; `HintControl`; `UndoControl`; `ResetAttemptControl`; `ConfirmSolutionButton`.
- Card semantics expose type, value/quantity, selected state, and allowed action to assistive technology.

### Guidance, feedback, and collections

- `TutorialStep`, `DemonstrationAnimation`, `ParentPromptCard`, `FeedbackBanner`, `CelebrationLayer`, `RewardReveal`, `BadgeTile`, `CardGuideEntry`, `ProgressSaveIndicator`.

### Settings

- `SegmentedChoice` for language/difficulty; `Switch` for sound, reduced motion, and quantity visuals; `AnimationIntensityChoice`; `ReplayTutorialAction`; `ResetProgressDialog`.

Component APIs should receive translation keys rather than visible strings, expose disabled reasons, and accept reduced-motion behavior. Game components render state and emit intent events; they do not contain validation rules.

## 10. Responsive behavior

- **Phone portrait:** mission header is compact; solution tray stays centered; card hand is a 2-row grid or horizontal snap strip; primary confirm button is sticky above the safe-area inset. Secondary controls collapse into a labeled “Tools” row, never an unlabeled overflow menu.
- **Tablet/desktop:** mission and progress at top; hand below; optional tools in a side rail. Keep the core play area under approximately 960 px so cards remain reachable and visually related.
- Do not horizontally scroll the page. Horizontal card-hand scrolling is acceptable only with visible clipped-next-card affordance and keyboard controls.
- Overlays become bottom sheets on phones and centered dialogs on larger screens. The focused control returns to its opener on close.
- Chinese labels may wrap to two lines without shrinking below the minimum type size; controls size to content.

## 11. Accessibility requirements

- Use landmarks and real headings; each screen has one `h1`. All actions are semantic `button` elements.
- Provide a skip link to the current mission, logical DOM order, and a highly visible 3 px focus ring with sufficient contrast.
- All functionality works with touch, mouse, switch/keyboard, and without dragging. Dragging is an enhancement only.
- Provide accessible names that include meaning and state, e.g. “Number 6, six stars, selected.” Do not announce decorative map art.
- Use `aria-live="polite"` for validation, selection count, and progress; celebrations are decorative and `aria-hidden`. Move focus only for meaningful screen/dialog changes, never after each card selection.
- Meet WCAG 2.2 AA contrast: 4.5:1 for normal text, 3:1 for large text and essential non-text boundaries. Card categories also use unique icons and silhouettes.
- Support browser text zoom to 200% without loss of controls or horizontal page overflow. Use minimum 18 px child-facing body text and generous line height.
- Respect system `prefers-reduced-motion` on first visit and allow an in-app override. Reduced mode removes parallax, floating loops, flips, and path travel; it retains instant state changes.
- Sound is off or gentle by default, never autoplays before interaction, has captions/visual equivalents, and can be muted globally. Core play never depends on audio.
- Avoid rapid flashes, patterned backgrounds behind text, all-caps instructions, and color-only correctness cues.
- Keep instructions on screen until the user acts. Do not use disappearing instructional toasts.
- On language switch, update the HTML `lang`, accessible names, live announcements, and current content without a reload; keep focus and game state stable.
- Test at 320 px width, touch targets, 200% zoom, keyboard-only, screen reader browse/focus modes, forced colors, reduced motion, English, and Simplified Chinese.

## 12. Content and state handoff notes

- All visible strings—including mission copy, prompt cards, feedback, badge reasons, tooltips, disabled reasons, and accessibility labels—must be translation keys.
- Persist language, settings, tutorial status, completed missions, discovered solutions, earned rewards, and current map progress. Do not persist transient focus, open overlays, or drag state.
- If stored data is corrupt or from a newer schema, recover to safe defaults while preserving language/settings where possible.
- Child-facing routes/screens must be reachable without reading the adult guide. The adult guide and product information are optional supporting paths, not onboarding gates.
- Analytics, registration, external links, purchases, advertisements, and public sharing are outside this prototype.

## 13. Acceptance criteria for UX implementation

- A first-time user reaches a playable card interaction within 90 seconds, or within 15 seconds by skipping the tutorial.
- Every screen has one visually dominant primary action and an obvious way back.
- A child can complete a mission using only taps; keyboard users can do the same without drag-and-drop.
- Invalid attempts preserve work and receive a specific, non-punitive clue.
- Multiple-solution missions visibly remember the first solution and reject only exact duplicates.
- Parent prompts are optional, one at a time, context-aware, and never interrupt play automatically.
- Difficulty and language remain adjustable; switching language does not reset or reload the current mission.
- A session can finish after any completed mission and returns to a meaningful progress view.
- Mobile layouts keep mission, solution tray, cards, and confirm action usable without horizontal page overflow.
- All visual meaning (selection, card category, success, map state) has a non-color cue and an accessible text equivalent.
