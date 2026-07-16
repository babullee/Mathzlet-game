# 25Y Puzzle — Game and Mathematics Design Specification

## Design promise

25Y Puzzle is a cooperative number adventure for one child (age 5–6) and a parent or other learning partner. The pair shares one hand, one mission, and one outcome. There are no turns to win, clocks, scores, lives, streak losses, or public rankings. A successful session is one in which the players notice, discuss, try, revise, and explain—not merely one in which they answer quickly.

The digital prototype should expose one decision at a time and use spoken-friendly instructions of about 3–8 words. Quantity pictures, icons, motion, and audio-ready cues carry meaning alongside text. The parent is a thinking partner, not an answer checker.

## Implementable core loop

1. **Pick a place.** Choose one of three initially playable map locations: Number Forest, Pattern Cave, or Shape River. Each place biases the mission types but does not lock content.
2. **Reveal one mission.** Animate a single mission card into the board. Show its goal with a target, example-free visual, and one short instruction.
3. **Look and talk.** Deal a small, guaranteed-solvable set of cards. Optionally reveal one parent prompt. Nothing is selected automatically.
4. **Build together.** Players tap or drag cards into a shared solution tray. Tap again or use Undo to return the last card. Strategy cards offer deliberate ways to alter the hand.
5. **Try the idea.** Confirm is enabled when the minimum submission shape is met. The validator returns a reasoned state, never a punitive state.
6. **Respond and explore.** A valid solution creates a discovery token. If the mission supports multiple solutions, the first success offers two equally prominent choices: **Another Way** or **Next Mission**. A developing idea stays on the board with one useful visual clue.
7. **Advance together.** Each completed mission moves the party one map step. After 3 missions, or whenever players choose Finish after a completed mission, celebrate one behavior-based reward and show Continue / Finish.

A session is 3–5 missions (roughly 15–30 minutes), but players may finish after any completed mission. Replaying a completed location is always allowed.

## Shared rules

### Card zones and selection

- A hand contains 4 cards at Explorer, 5–6 at Pathfinder, and 6–7 at Adventure Master before strategy effects.
- Number cards are reusable across missions but may be used only once within a submitted solution unless **Echo Card** is active.
- A definition such as `number-5` may have multiple dealt instances (`number-5-a`, `number-5-b`). Validation uses instance IDs to prevent using one physical card twice and values to identify mathematically distinct solutions.
- The solution tray preserves selection order for ordered tasks and subtraction. Addition-only tasks display a friendly `+` between cards and treat order as irrelevant.
- Number cards show a numeral plus a matching quantity visual when the setting is on. Values above 10 use grouped ten-and-extra visuals, not an unstructured field of dots.
- Puzzle missions replace the ordinary tray with 2–4 large answer choices or ordered slots, but use the same tap/drag/confirm interaction.
- Confirm is disabled only when the submission is structurally incomplete. It is never disabled merely because the current idea is mathematically invalid.
- Undo, Reset, Hint, Talk Together, Settings, and Finish remain reachable. Reset clears the current tray, not adventure progress.

### Mission lifecycle

Each mission moves through `ready → building → discovered → completed`. A multiple-solution mission may cycle `building ↔ discovered` while retaining its solution history. A mission is completed when its `solutionsRequired` count is met or the player selects Next Mission after at least one valid solution. Selecting Another Way clears only the tray and keeps the same hand.

Mission generation must occur before the reveal animation:

1. Filter content by current difficulty and location.
2. Avoid the immediately previous mission and, when possible, the previous mission type.
3. Build or choose a candidate hand/options.
4. Run the same pure validator used during play to prove at least one solution exists.
5. Reveal only after feasibility succeeds.

## Difficulty system

Difficulty changes the mathematical range and amount of information, not the value of a reward. It can be changed from Settings or the map at any time. A change applies to the next mission; the current mission may be finished or restarted at the new level.

| Level | Label | Mathematical focus | Presentation and limits | Mission design |
|---|---|---|---|---|
| 1 | Explorer / 小小探险家 | Counting, numeral–quantity matching, larger/smaller, classifying, sums to 10 | 4 cards or 2–3 choices; values 1–10; quantity pictures on; one condition; strong grouping cues | Addition only; AB/ABB patterns; one solution required; no strategy card required |
| 2 | Pathfinder / 寻路高手 | Addition and informal subtraction, patterns, classification, flexible decomposition | 5–6 cards or 3–4 choices; values 1–12; quantity pictures configurable; up to two conditions | Multiple solutions; ABC or growing patterns; totals to 15; optional strategy use |
| 3 | Adventure Master / 冒险大师 | Planning, multi-step reasoning, open ranges, simultaneous conditions | 6–7 cards; values 1–15, with 20 only in comparison/matching; grouped quantity visuals; up to three conditions | Exactly/at-least constraints, target adjustment, two-solution goals, strategy planning |

The chosen level is stored, but never permanently locks content or locations. If a child repeatedly requests the final hint or changes an idea three times, offer—not force—“Try Explorer clues for this mission.” Completing that mission does not change the saved level.

## Number card library

The prototype includes these 14 definitions (meeting the 12-card minimum). A deal may contain duplicate instances of a definition. Values `1–10` are available at all levels, `11–12` at levels 2–3, `15` at level 3 or curated level-2 comparison tasks, and `20` only in grouped-quantity comparison/matching tasks.

| ID | Value | Quantity visual | First level | Design note |
|---|---:|---|---:|---|
| `number-1` | 1 | one star | 1 | single object |
| `number-2` | 2 | two stars | 1 | pair grouping |
| `number-3` | 3 | three stars | 1 | triangular grouping |
| `number-4` | 4 | four stars | 1 | 2 × 2 grouping |
| `number-5` | 5 | five-frame | 1 | benchmark quantity |
| `number-6` | 6 | five-and-one | 1 | grouped, not scattered |
| `number-7` | 7 | five-and-two | 1 | grouped, not scattered |
| `number-8` | 8 | five-and-three | 1 | grouped, not scattered |
| `number-9` | 9 | five-and-four | 1 | grouped, not scattered |
| `number-10` | 10 | full ten-frame | 1 | benchmark quantity |
| `number-11` | 11 | ten-and-one | 2 | two visual groups |
| `number-12` | 12 | ten-and-two | 2 | two visual groups |
| `number-15` | 15 | ten-and-five | 3 | two visual groups |
| `number-20` | 20 | two tens | 3 | comparison/matching only |

Recommended data shape:

```js
{
  id: "number-5",
  type: "number",
  value: 5,
  labelKey: "numberFive",
  quantityVisual: { groupSize: 5, fullGroups: 1, remainder: 0 },
  icon: "star",
  difficulty: 1
}
```

## Puzzle-card activities

These are reusable activity templates rather than one-off fixed pictures.

### 1. Pattern Path (`pattern-next`)

Show a sequence with one empty final stepping stone and 3 answer cards. Explorer uses repeating AB/ABB patterns such as `2, 4, 2, 4, ?`; Pathfinder adds ABC and simple growing sequences such as `1, 2, 3, ?`; Adventure Master may omit an internal term or combine shape and quantity. The rule is encoded as `sequence` plus `validNextValues` (or a pure generator rule), never inferred from pixels.

### 2. Quantity Bridge (`match-equivalent`)

Show one numeral or grouped quantity on the left and 2–4 visual groups on the right. Select every equivalent representation. Examples include numeral 7 matched to five-and-two stars, or ten-and-two matched to 12. Distractors differ by at least 2 at Explorer and may differ by 1 at higher levels.

### 3. Odd Treasure (`odd-one-out`)

Show 3–4 cards where exactly one fails a visible shared rule. Explorer examples: three groups show 4 and one shows 6; Pathfinder examples: three even quantities and one odd. Store `property` and `oddChoiceId`, plus a short explanation key. Do not use culturally ambiguous categories.

### 4. Bigger Boat (`compare-groups`)

Show two or three quantities using both numerals and objects and ask for larger, smaller, or equal. Equal is introduced from Pathfinder. Validate the selected choice against calculated quantities, not an answer index.

## Mission library

The following 12 mission cards cover every required type. `candidateHands` are curated examples; production may generate a hand only if the feasibility check proves it solvable. All instructions and feedback are translation keys in implementation.

| ID | Type / place | Level | Goal and constraints | Curated solvable hand/options | Reward affinity |
|---|---|---:|---|---|---|
| `target-10-two` | target-number / Number Forest | 1 | Make 10 with exactly 2 cards; addition | `[1,2,3,4,5,5,6,7,8,9]`, deal 4 including a complement pair | Number Builder |
| `compare-big-group` | comparison / Shape River | 1 | Choose the larger of 2 pictured groups | quantities `[5,8]`, then variants `[3,7]`, `[6,9]` | Careful Observer |
| `classify-under-6` | classification / Number Forest | 1 | Select **all** dealt cards smaller than 6 | `[2,4,6,8]`; required set `[2,4]` | Sorting Scout |
| `pattern-ab-next` | pattern / Pattern Cave | 1 | Complete `2,4,2,4,?` | choices `[2,3,6]` | Pattern Explorer |
| `match-seven` | match-equivalent / Shape River | 1 | Match numeral 7 to its quantity | choices show 5, 7, 9 | Careful Observer |
| `target-12-two-ways` | multiple-solutions / Number Forest | 2 | Make 12 in 2 distinct ways; exactly 2 cards; addition | `[3,4,5,7,8,9]` guarantees `3+9`, `4+8`, `5+7` | Multiple-Solution Finder |
| `open-8-to-12` | open-ended / Number Forest | 2 | Use exactly 2 cards; total from 8 through 12 inclusive | `[2,3,5,6,7]` | Creative Thinker |
| `pattern-growing` | pattern / Pattern Cave | 2 | Complete `1,3,5,?` | choices `[6,7,8]`; rule add 2 | Pattern Explorer |
| `odd-even-treasure` | odd-one-out / Pattern Cave | 2 | Find the only odd quantity | choices `[2,4,7,8]` | Careful Observer |
| `target-15-flex` | target-number / Number Forest | 2 | Make 15 using 2 or 3 cards; addition | `[2,3,5,6,7,8,9]` | Number Builder |
| `three-step-14` | compound-target / Logic Mountain (later map step) | 3 | Make 14 with exactly 3 cards, including one card greater than 5 | `[1,2,3,4,6,7,8]` | Plan Maker |
| `ordered-gap-two` | sequence-build / Pattern Cave | 3 | Choose exactly 3 cards in increasing order; each is 2 more than the last | `[1,2,3,4,5,6,7,8]` (e.g. `1,3,5`) | Pattern Explorer |

Recommended mission objects:

```js
{
  id: "target-12-two-ways",
  type: "target-number",
  difficulty: 2,
  location: "number-forest",
  titleKey: "missionTargetTwelveTitle",
  instructionKey: "missionTargetTwelveTwoWays",
  target: 12,
  minimumCards: 2,
  maximumCards: 2,
  allowedOperations: ["add"],
  solutionsRequired: 2,
  allowMultipleSolutions: true,
  visualSupport: true,
  rewardId: "multiple-solution-finder"
}
```

```js
{
  id: "classify-under-6",
  type: "classification",
  difficulty: 1,
  location: "number-forest",
  instructionKey: "missionAllSmallerThanSix",
  predicate: { operator: "less-than", value: 6 },
  selectionRule: "all-matching",
  minimumCards: 1,
  rewardId: "sorting-scout"
}
```

## Strategy cards

Strategy cards are shared tools, not random bonuses. Each may be used once per mission; using one is always reversible until Confirm. At Explorer they appear as optional helper buttons after the first adjustment, while levels 2–3 show 2 strategy cards chosen for mission compatibility.

| ID | Display name | Exact action | Constraints |
|---|---|---|---|
| `swap-one` | Trail Swap | Select one uncommitted hand card, then choose its replacement from 3 face-up compatible cards. At least one offered replacement preserves mission solvability. | Cannot remove a card currently in the tray; undo selection first. |
| `draw-extra` | Extra Pocket | Add the lowest-value card from a shuffled compatible mini-pile that creates or preserves at least one solution. | Hand cap 8; deterministic eligibility prevents a dead draw. |
| `ask-clue` | Clue Compass | Reveal the next of three mission-specific hint tiers. | Marks `hintsUsed`; no score or reward loss. |
| `echo-card` | Echo Card | Select one number card; add one clearly marked virtual copy of its value to the tray. | Target/open-sum missions only; one virtual use; never counts as a distinct physical-card solution. |
| `nudge-target` | Target Nudge | Choose `−1` or `+1` for the current target, previewing both before confirmation. | Level 3 target missions only; target stays within mission `targetRange`; solution history is namespaced by adjusted target. |

Only four are required in the prototype; `nudge-target` is the recommended fifth if the advanced mission board supports it.

## Validation contract

Validation is a pure function of mission, available card instances, selected instances (and order), strategy effects, and prior discoveries. It must never read the DOM.

```js
validateSubmission({ mission, availableCards, selectedCards, effects, discoveredSolutions })
// => {
//   status: "incomplete" | "developing" | "valid-new" |
//           "valid-duplicate" | "invalid-data",
//   reasonKey: "...",
//   canonicalSolution: "..." | null,
//   progress: { found: 1, required: 2 }
// }
```

Global checks run before type-specific checks:

1. Mission has a known `type`, finite numeric fields, valid bounds, and relevant rules.
2. Every selected instance exists in the hand; no instance occurs twice unless represented by the single active Echo effect.
3. Selection count meets minimum/maximum or the exact expected option count.
4. Operations are allowed by the mission.
5. Type-specific predicate passes.

Type-specific rules:

- **Target number:** Calculate with the permitted operation. For addition, `sum(values) === effectiveTarget`. For subtraction, preserve selected order and evaluate left-to-right; do not introduce subtraction before level 2.
- **Multiple solutions:** Apply target validation, then compare the canonical solution with discoveries for this mission and effective target. Addition canonical form is sorted values joined by `+` (for example `3+9`); different instance IDs of the same values are not a new solution. Ordered/subtraction canonical form preserves order and operation.
- **Comparison:** Calculate each pictured quantity from its data. The selected choice must satisfy `larger`, `smaller`, or `equal`; do not validate by hardcoded screen position.
- **Pattern:** The selected value(s) must satisfy `validNextValues` or the explicit pure sequence rule. In a build-sequence mission, validate order and every adjacent relationship.
- **Classification:** Compute all eligible hand instance IDs with the predicate. For `all-matching`, the selected ID set must equal that complete set; selecting only some matches is `developing`, not success.
- **Open-ended:** Compute the selected total and accept every total inclusively within `[minimumTotal, maximumTotal]` while also enforcing card-count conditions.
- **Match equivalent:** Normalize each picture to an integer quantity and compare with the target quantity.
- **Compound target:** Every named constraint must pass: total, exact count, and property requirement. Return the first unmet condition as a visual hint key.

Use integer arithmetic only. Do not use `eval`. Unknown operations or malformed content return `invalid-data` and trigger safe replacement; they never show a child an error screen.

### Feedback mapping

| Validation state | Child-facing behavior |
|---|---|
| `incomplete` | Confirm remains unavailable; gently pulse the empty slot and say “Choose one more card.” |
| `developing` | Keep all cards in place; show one specific cue such as “The total is 9—look for one more.” Never say wrong/failed. |
| `valid-new` | Celebrate briefly, record discovery, name the observed behavior, and offer Another Way / Next Mission. |
| `valid-duplicate` | Celebrate recognition: “That way works. We saved it already—can we change one card?” Keep editing available. |
| `invalid-data` | Silently log for developers, replace with a safe curated mission, and tell players “The trail moved—here’s a new puzzle.” |

Hints are staged and non-punitive: (1) draw attention to a relevant visual feature, (2) narrow the useful cards, (3) demonstrate one next move without completing a multi-solution goal. A hint may be repeated or skipped. It never consumes points.

## Guaranteed-solvable deals and fallback handling

Before showing a number mission, enumerate all card subsets within its count bounds (and permutations only for ordered operations). Apply compatible strategy effects only if the mission explicitly requires one. A deal is feasible when the validator finds at least `min(1, solutionsRequired)` valid solution without a strategy card. Multiple-solution missions should prove `solutionsRequired` distinct canonical solutions in the initial hand.

Fallback ladder:

1. Generate a candidate deal and run feasibility.
2. Retry generation up to 3 times using different eligible values.
3. Use the mission's curated guaranteed hand.
4. If the mission definition itself is invalid, skip it and load `target-10-two` with `[2,3,4,6,7,8]` (at other levels it remains an accessible “quiet trail” rather than changing saved difficulty).
5. If a player has changed the hand into an unsolvable state, show **Trail Helper**. It offers: Undo last strategy, choose one of 3 face-up swaps (one guaranteed to restore a solution), or start a fresh solvable deal. No progress is lost.
6. After two developing submissions on the same idea, suggest Hint and Talk Together, but never trigger either automatically.

Puzzle-card fallback uses curated options with exactly the required number of valid answers. If an image fails, render its accessible numeral/shape/text-symbol fallback; validation never depends on the image loading.

## Rewards and achievements

Rewards recognize observable play behaviors. They are cards added to a shared collection, not currency and not a performance grade. The session chooses one eligible reward not yet earned; if all are earned, it presents a “favorite discovery” replay card instead of withholding celebration.

| ID | Reward | Evidence event |
|---|---|---|
| `creative-thinker` | Creative Thinker / 创意思考家 | Complete any open-ended mission or revise an idea into a valid one. |
| `pattern-explorer` | Pattern Explorer / 规律探险家 | Complete a pattern mission and reveal its rule. |
| `team-helper` | Team Helper / 合作小帮手 | Open a parent prompt and then make another selection, or use the optional “We talked” acknowledgment. |
| `number-builder` | Number Builder / 数字建造师 | Complete two target-number missions in a session. |
| `brave-guesser` | Brave Guesser / 勇敢尝试者 | Submit a developing idea, adjust at least one card, then discover a solution. |
| `multiple-solution-finder` | Multiple-Solution Finder / 多解发现者 | Record two distinct canonical solutions for one mission. |
| `careful-observer` | Careful Observer / 细心观察家 | Complete comparison or matching content. |
| `plan-maker` | Plan Maker / 计划小能手 | Use a strategy card and complete the mission. |

The minimum prototype should implement the first six; the last two are recommended. Also track cooperative achievements locally: tutorial complete, two solutions found, mission completed without a hint, strategy explained (optional self-acknowledgment), three mission types completed, and helper prompt used. “Without a hint” is a quiet collection criterion, never framed as better than using help.

Reward reveal lasts about 2 seconds at full motion and becomes an immediate fade in reduced motion. The collection shows icons, names, and “How we found it” evidence, never rarity tiers.

## Parent prompts

Show only one prompt on request. Rotate without interrupting play and prefer a prompt relevant to the current state:

- Before selection: “What do you notice?”
- After one card: “Which card could we try next?”
- After a developing idea: “What would happen if we changed this card?”
- After success: “How did you choose those cards?”
- On a multi-solution mission: “Can we find another way?”
- At session reflection: “Can you explain your idea?”

Opening a prompt never pauses the game. The prompt closes on tap outside, Escape, or a large Close button.

## Progression structure

- The map begins with Number Forest, Pattern Cave, and Shape River playable. This is choice, not a lock gate.
- Each completed mission adds one shared path step and records the mission type, location, solutions, hints, and relevant evidence events locally.
- Complete any 3 missions to discover Treasure Camp and earn the session reward. Treasure Camp is a celebration/collection screen, not another required test.
- Complete 2 different mission types to reveal Logic Mountain as an optional advanced destination. It remains visible but gently recommends Pathfinder or Adventure Master; Explorer players may still enter with Explorer-scaled content.
- Completing 3 different mission types decorates the map with a shared camp flag. It does not unlock superior rewards.
- Locations can be replayed indefinitely. Replays may surface a new parameterized variant and can earn behavior rewards.
- A new session resets only current hand, mission, and session counters. Completed missions, discovered reward cards, tutorial status, settings, and map decorations persist.
- Reset Adventure Progress requires adult-style confirmation with Cancel as the default focus; it preserves language/accessibility settings unless explicitly requested.

Suggested persisted progress:

```js
{
  schemaVersion: 1,
  completedMissionIds: [],
  completedMissionTypes: [],
  discoveredSolutionsByMission: {},
  earnedRewardIds: [],
  mapSteps: 0,
  logicMountainRevealed: false,
  tutorialCompleted: false
}
```

At load, validate stored IDs against current content. Ignore unknown IDs, deduplicate arrays, clamp numeric values, and fall back to a fresh progress object if JSON is corrupt. Never block entry to the game because storage is unavailable; continue in memory and show no child-facing technical warning.

## Content acceptance checklist

- Every generated hand is proven solvable before display.
- Every mission has a pure, type-specific rule and at least one curated fallback.
- Multiple-solution missions compare mathematical solutions, not card instance IDs.
- At least one each of target, multiple-solution, comparison, pattern, classification, and open-ended missions is playable.
- The prototype includes 14 number definitions, 4 puzzle activities, 12 mission cards, 5 strategy designs, and 8 reward designs.
- Explorer never requires reading a long sentence, holding more than one condition in mind, or using a strategy card.
- Help changes information or choices without taking away points or rewards.
- Players can Undo, Reset the tray, change difficulty for the next mission, or finish after any completion.
- Feedback is specific, positive, untimed, and available through text/symbol as well as color or motion.
